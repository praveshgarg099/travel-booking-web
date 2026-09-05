package org.telusco.travelbookingweb.exception;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DestinationNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleDestinationNotFound(
            DestinationNotFoundException exception) {

        return new ErrorResponse(
                404,
                exception.getMessage()
        );
    }

    @ExceptionHandler(TravelPackageNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleTravelPackageNotFound(
            TravelPackageNotFoundException exception) {

        return new ErrorResponse(
                404,
                exception.getMessage()
        );
    }
    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleUserNotFound(
            UserNotFoundException exception) {

        return new ErrorResponse(
                404,
                exception.getMessage()
        );
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidationException(
            MethodArgumentNotValidException exception) {

        String message = exception.getBindingResult()
                .getFieldErrors()
                .get(0)
                .getDefaultMessage();

        return new ErrorResponse(400, message);
    }
    @ExceptionHandler(PaymentNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handlePaymentNotFound(
            PaymentNotFoundException exception) {

        return new ErrorResponse(
                404,
                exception.getMessage()
        );
    }
    @ExceptionHandler(ReviewNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleReviewNotFound(
            ReviewNotFoundException exception) {

        return new ErrorResponse(
                404,
                exception.getMessage()
        );
    }
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<?> handleForbiddenException(
            ForbiddenException ex) {

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                        "status", 403,
                        "message", ex.getMessage()
                ));
    }
    @ExceptionHandler(InsufficientSeatsException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleInsufficientSeats(
            InsufficientSeatsException exception) {

        return new ErrorResponse(
                400,
                exception.getMessage()
        );
    }
    @ExceptionHandler(BookingNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleBookingNotFound(
            BookingNotFoundException exception) {

        return new ErrorResponse(
                404,
                exception.getMessage()
        );
    }
    @ExceptionHandler(PaymentAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handlePaymentAlreadyExists(
            PaymentAlreadyExistsException exception) {

        return new ErrorResponse(
                400,
                exception.getMessage()
        );
    }
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleIllegalArgumentException(
            IllegalArgumentException exception) {

        return new ErrorResponse(
                400,
                exception.getMessage()
        );
    }
    @ExceptionHandler(ReviewAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleReviewAlreadyExists(
            ReviewAlreadyExistsException exception) {

        return new ErrorResponse(400, exception.getMessage());
    }
    @ExceptionHandler(EmailAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleEmailAlreadyExists(
            EmailAlreadyExistsException exception) {

        return new ErrorResponse(400, exception.getMessage());
    }
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(
            InvalidCredentialsException ex) {

        ErrorResponse error = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                ex.getMessage()
        );

        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }
}