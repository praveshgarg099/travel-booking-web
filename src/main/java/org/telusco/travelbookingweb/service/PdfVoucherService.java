package org.telusco.travelbookingweb.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.telusco.travelbookingweb.entity.*;
import org.telusco.travelbookingweb.exception.BookingNotFoundException;
import org.telusco.travelbookingweb.exception.ForbiddenException;
import org.telusco.travelbookingweb.repository.BookingRepository;
import org.telusco.travelbookingweb.repository.PaymentRepository;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class PdfVoucherService {

    private static final Logger log = LoggerFactory.getLogger(PdfVoucherService.class);

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final AuthenticationService authenticationService;

    // Brand Palette
    private static final Color PRIMARY_NAVY = new Color(30, 58, 138);   // #1E3A8A
    private static final Color TEAL_ACCENT = new Color(13, 148, 136);   // #0D9488
    private static final Color DARK_SLATE = new Color(15, 23, 42);      // #0F172A
    private static final Color TEXT_MUTED = new Color(100, 116, 139);   // #64748B
    private static final Color BG_LIGHT = new Color(248, 250, 252);     // #F8FAFC
    private static final Color BORDER_GRAY = new Color(226, 232, 240);  // #E2E8F0
    private static final Color SUCCESS_GREEN = new Color(22, 163, 74);  // #16A34A
    private static final Color DANGER_RED = new Color(220, 38, 38);     // #DC2626

    // Fonts
    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, PRIMARY_NAVY);
    private static final Font SUBTITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA, 10, TEXT_MUTED);
    private static final Font SECTION_TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, TEAL_ACCENT);
    private static final Font HEADER_LABEL_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, TEXT_MUTED);
    private static final Font HEADER_VAL_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, DARK_SLATE);
    private static final Font BODY_FONT = FontFactory.getFont(FontFactory.HELVETICA, 9, DARK_SLATE);
    private static final Font BODY_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, DARK_SLATE);
    private static final Font TABLE_HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
    private static final Font FOOTER_FONT = FontFactory.getFont(FontFactory.HELVETICA, 8, TEXT_MUTED);

    public PdfVoucherService(
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            AuthenticationService authenticationService
    ) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.authenticationService = authenticationService;
    }

    @Transactional(readOnly = true)
    public byte[] generateBookingVoucherPdf(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with ID: " + bookingId));

        // Authorization check
        User currentUser = authenticationService.getCurrentUser();
        if (!booking.getUser().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You are not authorized to download this booking voucher");
        }

        // Look up payment details if any
        Optional<Payment> paymentOpt = paymentRepository.findFirstByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS);
        if (paymentOpt.isEmpty()) {
            paymentOpt = paymentRepository.findTopByBookingIdOrderByIdDesc(booking.getId());
        }

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter writer = PdfWriter.getInstance(document, baos);

            document.open();

            // 1. Header Banner & Document Meta
            addHeader(document, booking);

            // 2. Divider
            addDivider(document);

            // 3. Traveler & Trip Details with QR Code
            addTripDetailsAndQr(document, booking);

            // 4. Financial Breakdown Table
            addFinancialTable(document, booking);

            // 5. Payment Details Box
            addPaymentBox(document, booking, paymentOpt);

            // 6. Important Instructions & Terms
            addInstructionsBox(document);

            // 7. Footer
            addFooter(document);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF voucher for booking {}: {}", bookingId, e.getMessage(), e);
            throw new RuntimeException("Error generating booking voucher PDF: " + e.getMessage(), e);
        }
    }

    private void addHeader(Document doc, Booking booking) throws DocumentException {
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{60, 40});

        // Brand & Title
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        Paragraph brand = new Paragraph("YATRAMIGO", TITLE_FONT);
        Paragraph brandSub = new Paragraph("Official Booking Voucher & Tax Invoice", SUBTITLE_FONT);
        Paragraph companyTag = new Paragraph("Yatramigo Travel Technologies Pvt. Ltd. | CIN: U63040DL2024PTC123456", FOOTER_FONT);
        leftCell.addElement(brand);
        leftCell.addElement(brandSub);
        leftCell.addElement(companyTag);
        headerTable.addCell(leftCell);

        // Voucher metadata
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
        Paragraph vchrNo = new Paragraph();
        vchrNo.setAlignment(Element.ALIGN_RIGHT);
        vchrNo.add(new Chunk("VOUCHER #: ", HEADER_LABEL_FONT));
        vchrNo.add(new Chunk("YATRA-VCHR-" + booking.getId(), HEADER_VAL_FONT));

        Paragraph dateIssued = new Paragraph();
        dateIssued.setAlignment(Element.ALIGN_RIGHT);
        dateIssued.add(new Chunk("ISSUED ON: ", HEADER_LABEL_FONT));
        dateIssued.add(new Chunk(LocalDateTime.now().format(dtf), BODY_FONT));

        Paragraph statusPara = new Paragraph();
        statusPara.setAlignment(Element.ALIGN_RIGHT);
        statusPara.add(new Chunk("STATUS: ", HEADER_LABEL_FONT));
        String statusStr = booking.getStatus() != null ? booking.getStatus().name() : "PENDING";
        Color statusColor = "CONFIRMED".equalsIgnoreCase(statusStr) ? SUCCESS_GREEN
                : "CANCELLED".equalsIgnoreCase(statusStr) ? DANGER_RED : TEXT_MUTED;
        Font statusFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, statusColor);
        statusPara.add(new Chunk(statusStr, statusFont));

        rightCell.addElement(vchrNo);
        rightCell.addElement(dateIssued);
        rightCell.addElement(statusPara);
        headerTable.addCell(rightCell);

        doc.add(headerTable);
    }

    private void addDivider(Document doc) throws DocumentException {
        Paragraph p = new Paragraph();
        p.setSpacingBefore(8f);
        p.setSpacingAfter(10f);
        PdfPTable line = new PdfPTable(1);
        line.setWidthPercentage(100);
        PdfPCell c = new PdfPCell();
        c.setFixedHeight(2f);
        c.setBackgroundColor(PRIMARY_NAVY);
        c.setBorder(Rectangle.NO_BORDER);
        line.addCell(c);
        p.add(line);
        doc.add(p);
    }

    private void addTripDetailsAndQr(Document doc, Booking booking) throws Exception {
        PdfPTable detailsTable = new PdfPTable(2);
        detailsTable.setWidthPercentage(100);
        detailsTable.setWidths(new float[]{68, 32});

        TravelPackage pkg = booking.getTravelPackage();
        User user = booking.getUser();
        String destination = (pkg != null && pkg.getDestination() != null)
                ? pkg.getDestination().getName() + ", " + pkg.getDestination().getCountry()
                : "N/A";
        String pkgTitle = pkg != null ? pkg.getTitle() : "Travel Package #" + (pkg != null ? pkg.getId() : "N/A");
        String duration = pkg != null && pkg.getDuration() != null ? pkg.getDuration() + " Days" : "Standard";

        // Left Column: Traveler & Itinerary
        PdfPCell left = new PdfPCell();
        left.setBorder(Rectangle.NO_BORDER);
        left.setPaddingRight(10f);

        Paragraph secTitle = new Paragraph("TRAVELER & ITINERARY INFORMATION", SECTION_TITLE_FONT);
        secTitle.setSpacingAfter(6f);
        left.addElement(secTitle);

        PdfPTable infoGrid = new PdfPTable(2);
        infoGrid.setWidthPercentage(100);
        infoGrid.setWidths(new float[]{35, 65});

        addInfoRow(infoGrid, "Lead Traveler:", user != null ? user.getName() : "Customer");
        addInfoRow(infoGrid, "Contact Email:", user != null ? user.getEmail() : "N/A");
        addInfoRow(infoGrid, "Package Name:", pkgTitle);
        addInfoRow(infoGrid, "Destination:", destination);
        addInfoRow(infoGrid, "Travel Date:", booking.getBookingDate() != null ? booking.getBookingDate().toString() : "N/A");
        addInfoRow(infoGrid, "Trip Duration:", duration);
        addInfoRow(infoGrid, "No. of Guests:", String.valueOf(booking.getNumberOfPeople()));
        left.addElement(infoGrid);
        detailsTable.addCell(left);

        // Right Column: QR Code & Verification
        PdfPCell right = new PdfPCell();
        right.setBorder(Rectangle.BOX);
        right.setBorderColor(BORDER_GRAY);
        right.setBackgroundColor(BG_LIGHT);
        right.setPadding(8f);
        right.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph qrTitle = new Paragraph("DIGITAL VERIFICATION", SECTION_TITLE_FONT);
        qrTitle.setAlignment(Element.ALIGN_CENTER);
        qrTitle.setSpacingAfter(4f);
        right.addElement(qrTitle);

        String qrPayload = String.format(
                "YATRAMIGO TRIP VOUCHER\nBooking ID: #%d\nTraveler: %s\nPackage: %s\nTravel Date: %s\nGuests: %d\nTotal: ₹%.2f\nStatus: %s",
                booking.getId(),
                user != null ? user.getName() : "Customer",
                pkgTitle,
                booking.getBookingDate(),
                booking.getNumberOfPeople(),
                booking.getTotalAmount(),
                booking.getStatus()
        );

        Image qrImage = generateQrCodeImage(qrPayload, 110, 110);
        qrImage.setAlignment(Element.ALIGN_CENTER);
        right.addElement(qrImage);

        Paragraph scanNote = new Paragraph("Scan with camera for instant on-site check-in verification", FOOTER_FONT);
        scanNote.setAlignment(Element.ALIGN_CENTER);
        scanNote.setSpacingBefore(4f);
        right.addElement(scanNote);

        detailsTable.addCell(right);
        detailsTable.setSpacingAfter(12f);
        doc.add(detailsTable);
    }

    private void addInfoRow(PdfPTable table, String label, String value) {
        PdfPCell lCell = new PdfPCell(new Phrase(label, HEADER_LABEL_FONT));
        lCell.setBorder(Rectangle.NO_BORDER);
        lCell.setPaddingBottom(4f);

        PdfPCell vCell = new PdfPCell(new Phrase(value, BODY_BOLD));
        vCell.setBorder(Rectangle.NO_BORDER);
        vCell.setPaddingBottom(4f);

        table.addCell(lCell);
        table.addCell(vCell);
    }

    private void addFinancialTable(Document doc, Booking booking) throws DocumentException {
        Paragraph sec = new Paragraph("TAX INVOICE & PRICE BREAKDOWN", SECTION_TITLE_FONT);
        sec.setSpacingAfter(6f);
        doc.add(sec);

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{40, 15, 12, 15, 18});

        // Headers
        addTableHeader(table, "Item & Description");
        addTableHeader(table, "Unit Rate (₹)");
        addTableHeader(table, "Qty");
        addTableHeader(table, "GST (5%)");
        addTableHeader(table, "Total Amount (₹)");

        TravelPackage pkg = booking.getTravelPackage();
        double unitRate = pkg != null ? pkg.getPrice() : (booking.getTotalAmount() / Math.max(1, booking.getNumberOfPeople()));
        int qty = booking.getNumberOfPeople();
        double total = booking.getTotalAmount();

        // 5% GST Included calculation
        BigDecimal totalBd = BigDecimal.valueOf(total);
        BigDecimal baseFareBd = totalBd.divide(BigDecimal.valueOf(1.05), 2, RoundingMode.HALF_UP);
        BigDecimal gstTotalBd = totalBd.subtract(baseFareBd);

        PdfPCell descCell = new PdfPCell(new Phrase(pkg != null ? pkg.getTitle() : "Travel Booking Package", BODY_FONT));
        descCell.setPadding(6f);
        descCell.setBorderColor(BORDER_GRAY);

        PdfPCell rateCell = new PdfPCell(new Phrase(String.format("₹%.2f", unitRate), BODY_FONT));
        rateCell.setPadding(6f);
        rateCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        rateCell.setBorderColor(BORDER_GRAY);

        PdfPCell qtyCell = new PdfPCell(new Phrase(String.valueOf(qty), BODY_FONT));
        qtyCell.setPadding(6f);
        qtyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        qtyCell.setBorderColor(BORDER_GRAY);

        PdfPCell gstCell = new PdfPCell(new Phrase(String.format("₹%.2f", gstTotalBd.doubleValue()), BODY_FONT));
        gstCell.setPadding(6f);
        gstCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        gstCell.setBorderColor(BORDER_GRAY);

        PdfPCell amtCell = new PdfPCell(new Phrase(String.format("₹%.2f", total), BODY_BOLD));
        amtCell.setPadding(6f);
        amtCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        amtCell.setBorderColor(BORDER_GRAY);

        table.addCell(descCell);
        table.addCell(rateCell);
        table.addCell(qtyCell);
        table.addCell(gstCell);
        table.addCell(amtCell);

        // Subtotal & Tax Rows
        addSummaryRow(table, "Subtotal (Taxable Base Fare):", String.format("₹%.2f", baseFareBd.doubleValue()));
        addSummaryRow(table, "Integrated GST (IGST 5.0% Included):", String.format("₹%.2f", gstTotalBd.doubleValue()));
        addSummaryRow(table, "Final Grand Total Paid:", String.format("₹%.2f", total), true);

        table.setSpacingAfter(10f);
        doc.add(table);
    }

    private void addTableHeader(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, TABLE_HEADER_FONT));
        cell.setBackgroundColor(PRIMARY_NAVY);
        cell.setPadding(6f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBorderColor(PRIMARY_NAVY);
        table.addCell(cell);
    }

    private void addSummaryRow(PdfPTable table, String label, String value) {
        addSummaryRow(table, label, value, false);
    }

    private void addSummaryRow(PdfPTable table, String label, String value, boolean isTotal) {
        PdfPCell empty = new PdfPCell(new Phrase("", BODY_FONT));
        empty.setColspan(2);
        empty.setBorder(Rectangle.NO_BORDER);
        table.addCell(empty);

        PdfPCell labelCell = new PdfPCell(new Phrase(label, isTotal ? BODY_BOLD : HEADER_LABEL_FONT));
        labelCell.setColspan(2);
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        labelCell.setPadding(4f);
        labelCell.setBorder(Rectangle.NO_BORDER);
        if (isTotal) {
            labelCell.setBackgroundColor(BG_LIGHT);
        }
        table.addCell(labelCell);

        PdfPCell valCell = new PdfPCell(new Phrase(value, isTotal ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, PRIMARY_NAVY) : BODY_BOLD));
        valCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valCell.setPadding(4f);
        valCell.setBorder(Rectangle.NO_BORDER);
        if (isTotal) {
            valCell.setBackgroundColor(BG_LIGHT);
        }
        table.addCell(valCell);
    }

    private void addPaymentBox(Document doc, Booking booking, Optional<Payment> paymentOpt) throws DocumentException {
        PdfPTable box = new PdfPTable(1);
        box.setWidthPercentage(100);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(BG_LIGHT);
        cell.setBorderColor(BORDER_GRAY);
        cell.setPadding(8f);

        Paragraph pTitle = new Paragraph("PAYMENT & TRANSACTION RECEIPT", SECTION_TITLE_FONT);
        pTitle.setSpacingAfter(4f);
        cell.addElement(pTitle);

        PdfPTable grid = new PdfPTable(4);
        grid.setWidthPercentage(100);
        grid.setWidths(new float[]{25, 25, 25, 25});

        String payStatus = paymentOpt.map(p -> p.getStatus().name()).orElse("PENDING");
        String payMethod = paymentOpt.map(p -> p.getPaymentMethod() != null ? p.getPaymentMethod().name() : "ONLINE").orElse("N/A");
        String payRef = paymentOpt.map(p -> p.getRazorpayPaymentId() != null ? p.getRazorpayPaymentId() : (p.getRazorpayOrderId() != null ? p.getRazorpayOrderId() : "TXN-" + p.getId())).orElse("UNPAID");
        String payDate = paymentOpt.map(p -> p.getPaymentDate() != null ? p.getPaymentDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")) : "Pending").orElse("Pending");

        addGridCell(grid, "Payment Status:", payStatus, "SUCCESS".equalsIgnoreCase(payStatus) ? SUCCESS_GREEN : PRIMARY_NAVY);
        addGridCell(grid, "Payment Method:", payMethod, DARK_SLATE);
        addGridCell(grid, "Transaction ID:", payRef, DARK_SLATE);
        addGridCell(grid, "Paid At:", payDate, DARK_SLATE);

        cell.addElement(grid);

        // If refunded, show refund note
        if (paymentOpt.isPresent() && (paymentOpt.get().getStatus() == PaymentStatus.REFUNDED || paymentOpt.get().getStatus() == PaymentStatus.PARTIALLY_REFUNDED)) {
            Payment p = paymentOpt.get();
            Paragraph refundAlert = new Paragraph();
            refundAlert.setSpacingBefore(4f);
            refundAlert.add(new Chunk("Refund Notice: ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, DANGER_RED)));
            refundAlert.add(new Chunk(String.format("₹%.2f refunded on %s (ID: %s)",
                    p.getRefundAmount() != null ? p.getRefundAmount() : 0.0,
                    p.getRefundDate() != null ? p.getRefundDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy")) : "N/A",
                    p.getRefundId() != null ? p.getRefundId() : "Manual"
            ), FOOTER_FONT));
            cell.addElement(refundAlert);
        }

        box.addCell(cell);
        box.setSpacingAfter(10f);
        doc.add(box);
    }

    private void addGridCell(PdfPTable grid, String label, String val, Color color) {
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.NO_BORDER);
        c.addElement(new Paragraph(label, HEADER_LABEL_FONT));
        c.addElement(new Paragraph(val, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, color)));
        grid.addCell(c);
    }

    private void addInstructionsBox(Document doc) throws DocumentException {
        PdfPTable box = new PdfPTable(1);
        box.setWidthPercentage(100);

        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(BORDER_GRAY);
        cell.setPadding(8f);

        Paragraph t = new Paragraph("IMPORTANT TRAVEL INSTRUCTIONS & POLICIES", SECTION_TITLE_FONT);
        t.setSpacingAfter(4f);
        cell.addElement(t);

        com.lowagie.text.List list = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED);
        list.setListSymbol("• ");
        list.add(new ListItem("Identification: A valid government-issued photo ID (Aadhaar / Passport / Voter ID / Driving License) is mandatory for each traveler at departure.", BODY_FONT));
        list.add(new ListItem("Reporting Time: Please arrive at the meeting point / hotel at least 30 minutes prior to scheduled departure time.", BODY_FONT));
        list.add(new ListItem("Baggage: Standard allowance of 15kg check-in + 7kg cabin baggage per traveler applies unless otherwise specified in your package itinerary.", BODY_FONT));
        list.add(new ListItem("Support & Assistance: For itinerary amendments, 24/7 emergency support, or guidance, reach out to help@yatramigo.dev or call +91-98765-43210.", BODY_FONT));

        cell.addElement(list);
        box.addCell(cell);
        box.setSpacingAfter(8f);
        doc.add(box);
    }

    private void addFooter(Document doc) throws DocumentException {
        Paragraph footer = new Paragraph();
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.add(new Chunk("This is a computer-generated tax invoice and trip voucher. No signature is required.\n", FOOTER_FONT));
        footer.add(new Chunk("Yatramigo Travel Technologies Pvt. Ltd. | 100% Secure Bookings | Made with ❤️ for Travelers", FOOTER_FONT));
        doc.add(footer);
    }

    private Image generateQrCodeImage(String text, int width, int height) throws Exception {
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
        hints.put(EncodeHintType.MARGIN, 1);

        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, width, height, hints);
        BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);

        Image image = Image.getInstance(bufferedImage, null);
        image.scaleAbsolute(width, height);
        return image;
    }
}
