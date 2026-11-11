package edu.se411.madarfleet.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class FleetConfiguration {
    @Bean
    Clock fleetClock() {
        return Clock.system(ZoneId.of("Asia/Riyadh"));
    }
}
