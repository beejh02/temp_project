package com.nurigo.nurigo.wallet;

import java.util.UUID;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.nurigo.nurigo.mission.config.DemoMissionCatalog;
import com.nurigo.nurigo.mission.config.MissionRunCatalog;
import com.nurigo.nurigo.mission.controller.MissionController;
import com.nurigo.nurigo.mission.controller.MissionSessionCookieFactory;
import com.nurigo.nurigo.mission.policy.DailyMissionPolicy;
import com.nurigo.nurigo.mission.runtime.MissionRunStateStore;
import com.nurigo.nurigo.wallet.controller.WalletController;
import com.nurigo.nurigo.wallet.controller.WalletExceptionHandler;
import com.nurigo.nurigo.wallet.service.WalletService;

class WalletExchangeHttpTest {
    private final MissionRunStateStore state = new MissionRunStateStore("42");
    private final DemoMissionCatalog definitions = new DemoMissionCatalog();
    private MockMvc mvc;
    private Cookie cookie;

    @BeforeEach
    void setup() {
        var catalog = mock(MissionRunCatalog.class);
        when(catalog.getAssignmentDefinitions()).thenReturn(definitions.getDefinitions());
        var policy = new DailyMissionPolicy();
        var service = new WalletService(state, catalog, policy);
        mvc = MockMvcBuilders.standaloneSetup(new WalletController(service,
                new MissionSessionCookieFactory(false, "Lax")))
                .setControllerAdvice(new WalletExceptionHandler()).build();
        cookie = new Cookie(MissionController.SESSION_COOKIE_NAME,
                state.resolveSession(null, definitions.getDefinitions(), policy).sessionId());
    }

    @Test
    void 교환_목록은_서버의_비용과_시연_여부를_제공한다() throws Exception {
        mvc.perform(get("/api/wallet/benefits"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].cost").value(10))
                .andExpect(jsonPath("$[0].demo").value(true));
    }

    @Test
    void 잘못된_입력과_잔액_부족에_적절한_오류를_반환한다() throws Exception {
        for (String body : new String[]{"{}", "{\"benefitId\":\"snack\",\"requestId\":\"bad\"}"}) {
            mvc.perform(post("/api/wallet/exchanges").cookie(cookie).contentType("application/json").content(body))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isNotEmpty());
        }
        mvc.perform(post("/api/wallet/exchanges").cookie(cookie).contentType("application/json")
                .content(body("missing"))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/wallet/exchanges").cookie(cookie).contentType("application/json")
                .content(body("snack"))).andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("사용 가능한 포인트가 부족해요."));
    }

    @Test
    void 교환_응답과_재조회에서_같은_쿠폰과_차감_잔액을_확인한다() throws Exception {
        String id = cookie.getValue();
        for (var mission : definitions.getDefinitions()) {
            if (state.getAssignedMissionKeys(id).contains(mission.getMissionKey())) {
                state.completeMission(id, mission); state.claimReward(id, mission);
            }
        }
        int before = state.getWallet(id).balance();
        String request = body("snack");
        for (int i = 0; i < 2; i++) mvc.perform(post("/api/wallet/exchanges").cookie(cookie)
                .contentType("application/json").content(request))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.wallet.balance").value(before - 10))
                .andExpect(jsonPath("$.wallet.coupons.length()").value(1));
        mvc.perform(get("/api/wallet").cookie(cookie)).andExpect(status().isOk())
                .andExpect(jsonPath("$.coupons[0].id").value(state.getWallet(id).coupons().get(0).id()));
    }

    private String body(String benefitId) {
        return "{\"benefitId\":\"%s\",\"requestId\":\"%s\"}".formatted(benefitId, UUID.randomUUID());
    }
}
