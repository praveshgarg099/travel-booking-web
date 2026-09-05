package org.telusco.travelbookingweb.exception;

public class TravelPackageNotFoundException extends RuntimeException{
    public TravelPackageNotFoundException(String message){
        super(message);
    }
}
