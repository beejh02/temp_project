package com.nurigo.nurigo.market.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.nurigo.nurigo.market.service.DuplicateMarketNameException;
import com.nurigo.nurigo.market.service.MarketNotFoundException;

@RestControllerAdvice(assignableTypes = MarketController.class)
public class MarketExceptionHandler {

    @ExceptionHandler(MarketNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            MarketNotFoundException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(exception.getMessage()));
    }

    @ExceptionHandler(DuplicateMarketNameException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateName(
            DuplicateMarketNameException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(exception.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRequest(
            IllegalArgumentException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(exception.getMessage()));
    }

    public record ErrorResponse(String message) {

    }
}
