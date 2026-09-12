package com.nurigo.nurigo.wallet;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

class WalletHttpContractTest {
    @Test
    void 지갑_직접_조회도_같은_익명_세션을_발급하고_재사용한다() throws Exception {
        var catalog = mock(MissionRunCatalog.class);
        when(catalog.getAssignmentDefinitions()).thenReturn(new DemoMissionCatalog().getDefinitions());
        var state = new MissionRunStateStore("42");
        var service = new WalletService(state, catalog, new DailyMissionPolicy());
        var mvc = MockMvcBuilders.standaloneSetup(new WalletController(service,
                new MissionSessionCookieFactory(false, "Lax")))
                .setControllerAdvice(new WalletExceptionHandler()).build();
        var response = mvc.perform(get("/api/wallet"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.balance").value(0))
                .andExpect(jsonPath("$.totalEarned").value(0))
                .andExpect(jsonPath("$.transactions").isEmpty())
                .andExpect(cookie().httpOnly(MissionController.SESSION_COOKIE_NAME, true))
                .andReturn().getResponse();
        var cookie = response.getCookie(MissionController.SESSION_COOKIE_NAME);
        mvc.perform(get("/api/wallet").cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(cookie().doesNotExist(MissionController.SESSION_COOKIE_NAME))
                .andExpect(jsonPath("$.nickname").value(state.getWallet(cookie.getValue()).nickname()));
    }
}
