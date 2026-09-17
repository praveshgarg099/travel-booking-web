package org.telusco.travelbookingweb.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Converter(autoApply = true)
public class PaymentStatusConverter implements AttributeConverter<PaymentStatus, String> {

    private static final Logger log = LoggerFactory.getLogger(PaymentStatusConverter.class);

    @Override
    public String convertToDatabaseColumn(PaymentStatus attribute) {
        return attribute != null ? attribute.name() : null;
    }

    @Override
    public PaymentStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        try {
            return PaymentStatus.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown PaymentStatus encountered in database: '{}'. Defaulting to PENDING to prevent crash.", dbData);
            return PaymentStatus.PENDING;
        }
    }
}
