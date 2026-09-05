package org.telusco.travelbookingweb.exception;

public class DestinationNotFoundException extends RuntimeException {

    public DestinationNotFoundException(String message) {
        super(message);
    }
}