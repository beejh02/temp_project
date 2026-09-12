package com.nurigo.nurigo.wallet.service;

import org.springframework.stereotype.Service;

import com.nurigo.nurigo.mission.config.MissionRunCatalog;
import com.nurigo.nurigo.mission.policy.DailyMissionPolicy;
import com.nurigo.nurigo.mission.runtime.MissionRunStateStore;
import com.nurigo.nurigo.mission.service.MissionSessionResult;
import com.nurigo.nurigo.wallet.dto.WalletResponse;
import com.nurigo.nurigo.wallet.dto.ExchangeRequest;
import com.nurigo.nurigo.wallet.dto.ExchangeResponse;

@Service
public class WalletService {
    private final MissionRunStateStore stateStore;
    private final MissionRunCatalog catalog;
    private final DailyMissionPolicy policy;

    public WalletService(MissionRunStateStore stateStore, MissionRunCatalog catalog,
            DailyMissionPolicy policy) {
        this.stateStore = stateStore;
        this.catalog = catalog;
        this.policy = policy;
    }

    public MissionSessionResult<WalletResponse> getWallet(String requestedSessionId) {
        var session = stateStore.resolveSession(requestedSessionId, catalog.getDefinitions(), policy);
        return new MissionSessionResult<>(session.sessionId(), session.created(),
                stateStore.getWallet(session.sessionId()));
    }

    public MissionSessionResult<ExchangeResponse> exchange(String requestedSessionId, ExchangeRequest request) {
        var session = stateStore.resolveSession(requestedSessionId, catalog.getDefinitions(), policy);
        return new MissionSessionResult<>(session.sessionId(), session.created(),
                stateStore.exchangeBenefit(session.sessionId(), request.benefitId(), request.requestId()));
    }
}
