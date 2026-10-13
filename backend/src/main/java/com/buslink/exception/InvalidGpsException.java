package com.buslink.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class InvalidGpsException extends RuntimeException {
    public InvalidGpsException(String message) {
        super(message);
    }
}
