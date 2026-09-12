package com.nurigo.nurigo.wallet.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;
import java.util.List;

import com.nurigo.nurigo.mission.controller.MissionController;
import com.nurigo.nurigo.mission.controller.MissionSessionCookieFactory;
import com.nurigo.nurigo.mission.service.MissionSessionResult;
import com.nurigo.nurigo.wallet.dto.WalletResponse;
import com.nurigo.nurigo.wallet.dto.BenefitResponse;
import com.nurigo.nurigo.wallet.dto.ExchangeRequest;
import com.nurigo.nurigo.wallet.dto.ExchangeResponse;
import com.nurigo.nurigo.wallet.runtime.DemoBenefitCatalog;
import com.nurigo.nurigo.wallet.service.WalletService;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {
    private final WalletService service;
    private final MissionSessionCookieFactory cookieFactory;

    public WalletController(WalletService service, MissionSessionCookieFactory cookieFactory) {
        this.service = service;
        this.cookieFactory = cookieFactory;
    }

    @GetMapping
    public ResponseEntity<WalletResponse> getWallet(
            @CookieValue(name = MissionController.SESSION_COOKIE_NAME, required = false) String sessionId) {
        return response(service.getWallet(sessionId));
    }

    private <T> ResponseEntity<T> response(MissionSessionResult<T> result) {
        var response = ResponseEntity.ok().cacheControl(org.springframework.http.CacheControl.noStore());
        if (result.newSession()) {
            response.header(HttpHeaders.SET_COOKIE, cookieFactory.create(
                    MissionController.SESSION_COOKIE_NAME, result.sessionId()).toString());
        }
        return response.body(result.data());
    }

    @GetMapping("/benefits")
    public List<BenefitResponse> getBenefits() { return DemoBenefitCatalog.all(); }

    @PostMapping("/exchanges")
    public ResponseEntity<ExchangeResponse> exchange(
            @CookieValue(name = MissionController.SESSION_COOKIE_NAME, required = false) String sessionId,
            @Valid @RequestBody ExchangeRequest request) {
        return response(service.exchange(sessionId, request));
    }
}
