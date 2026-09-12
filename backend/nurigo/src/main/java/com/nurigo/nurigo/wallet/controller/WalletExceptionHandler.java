package com.nurigo.nurigo.wallet.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = WalletController.class)
public class WalletExceptionHandler {
    @ExceptionHandler({org.springframework.web.bind.MethodArgumentNotValidException.class,
            org.springframework.http.converter.HttpMessageNotReadableException.class})
    public ResponseEntity<ErrorResponse> malformedRequest(Exception exception) {
        return ResponseEntity.badRequest().body(new ErrorResponse("혜택과 올바른 교환 요청 번호가 필요합니다."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> invalidRequest(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> conflict(IllegalStateException exception) {
        return ResponseEntity.status(409).body(new ErrorResponse(exception.getMessage()));
    }

    public record ErrorResponse(String message) { }
}
