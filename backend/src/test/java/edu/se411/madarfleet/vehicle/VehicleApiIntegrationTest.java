package edu.se411.madarfleet.vehicle;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:h2:mem:madar-api-test;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "madar.seed-demo-data=true"
})
class VehicleApiIntegrationTest {
    private static final String BASE = "/api/vehicles";
    private static final String VALID = """
            {
              "make":"Mazda","model":"CX-5","year":2025,"plate":"QA 4100",
              "branch":"Riyadh","status":"Available","mileage":17500,"value":105000.50,
              "serviceDate":"","notes":"Integration example"
            }
            """;

    @LocalServerPort
    private int port;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final JsonMapper json = new JsonMapper();

    @Test
    void createsLooksUpUpdatesAndPaginatesViaRealHttp() throws Exception {
        JsonNode initial = body(get(BASE + "?page=0&size=3"), 200);
        assertThat(initial.get("totalElements").asInt()).isEqualTo(8);
        assertThat(initial.get("totalPages").asInt()).isEqualTo(3);
        assertThat(initial.get("items").size()).isEqualTo(3);
        assertThat(initial.get("items").get(0).get("id").asString()).isEqualTo("MF-001");
        assertThat(initial.get("hasNext").asBoolean()).isTrue();
        assertThat(initial.get("hasPrevious").asBoolean()).isFalse();
        JsonNode second = body(get(BASE + "?page=1&size=3"), 200);
        assertThat(second.get("items").get(0).get("id").asString()).isEqualTo("MF-004");

        HttpResponse<String> createdResponse = send("POST", BASE, VALID);
        JsonNode created = body(createdResponse, 201);
        String id = created.get("id").asString();
        assertThat(id).isEqualTo("MF-009");
        String path = BASE + "/" + id;
        assertThat(createdResponse.headers().firstValue("Location")).contains(path);
        assertThat(body(get(path), 200)).isEqualTo(created);

        String editedJson = VALID.replace("\"Available\"", "\"Assigned\",\"driver\":\"Demo Driver\"")
                .replace("17500", "18100").replace("\"QA 4100\"", "\"qa-4100\"");
        JsonNode updated = body(send("PUT", path, editedJson), 200);
        assertThat(updated.get("id").asString()).isEqualTo(id);
        assertThat(updated.get("status").asString()).isEqualTo("Assigned");
        assertThat(updated.get("driver").asString()).isEqualTo("Demo Driver");
        assertThat(updated.get("mileage").asInt()).isEqualTo(18100);
        assertThat(body(get(path), 200)).isEqualTo(updated);

        JsonNode last = body(get(BASE + "?page=2&size=3"), 200);
        assertThat(last.get("totalElements").asInt()).isEqualTo(9);
        assertThat(last.get("items").get(2).get("id").asString()).isEqualTo(id);
        assertThat(last.get("hasNext").asBoolean()).isFalse();
        assertThat(last.get("hasPrevious").asBoolean()).isTrue();
        JsonNode empty = body(get(BASE + "?page=3&size=3"), 200);
        assertThat(empty.get("items").size()).isZero();
        assertThat(empty.get("totalElements").asInt()).isEqualTo(9);
    }

    @Test
    void validUnknownIdReturns404ForReadAndUpdate() throws Exception {
        assertThat(body(get(BASE + "/MF-999"), 404).get("code").asString())
                .isEqualTo("VEHICLE_NOT_FOUND");
        assertThat(body(send("PUT", BASE + "/MF-999", VALID), 404).get("code").asString())
                .isEqualTo("VEHICLE_NOT_FOUND");
    }

    @Test
    void duplicateRegistrationIsRejectedOnCreateAndUpdate() throws Exception {
        JsonNode duplicate = body(send("POST", BASE, VALID.replace("QA 4100", " rkd-4821 ")), 409);
        assertThat(duplicate.get("code").asString()).isEqualTo("DUPLICATE_PLATE");
        assertThat(duplicate.get("fieldErrors").has("plate")).isTrue();
        assertThat(body(send("PUT", BASE + "/MF-001", VALID.replace("QA 4100", "JHD7352")), 409)
                .get("code").asString()).isEqualTo("DUPLICATE_PLATE");
        assertThat(body(get(BASE + "/MF-001"), 200).get("plate").asString()).isEqualTo("RKD 4821");
    }

    @Test
    void missingInvalidAndConditionalFieldsHaveFieldErrors() throws Exception {
        JsonNode invalid = body(send("POST", BASE, VALID
                .replace("\"Mazda\"", "\"\"")
                .replace("\"Available\"", "\"Assigned\"")
                .replace("17500", "-1")
                .replace("\"serviceDate\":\"\"", "\"serviceDate\":\"2026-02-30\"")), 400);
        assertThat(invalid.get("fieldErrors").has("make")).isTrue();
        assertThat(invalid.get("fieldErrors").has("mileage")).isTrue();

        JsonNode ruleErrors = body(send("POST", BASE, VALID
                .replace("\"Available\"", "\"Assigned\"")
                .replace("\"serviceDate\":\"\"", "\"serviceDate\":\"2026-02-30\"")), 400);
        assertThat(ruleErrors.get("fieldErrors").has("driver")).isTrue();
        assertThat(ruleErrors.get("fieldErrors").has("serviceDate")).isTrue();
    }

    @Test
    void malformedJsonAndFractionalMileageAreRejected() throws Exception {
        assertThat(body(send("POST", BASE, "{"), 400).get("code").asString()).isEqualTo("INVALID_BODY");
        assertThat(body(send("POST", BASE, VALID.replace("17500", "17500.25")), 400)
                .get("code").asString()).isEqualTo("INVALID_BODY");
    }

    @ParameterizedTest
    @CsvSource(value = {"/invalid|id", "?page=-1|page", "?page=word|page", "?size=101|size"}, delimiter = '|')
    void badPathAndQueryParametersReturnFieldErrors(String suffix, String field) throws Exception {
        JsonNode response = body(get(BASE + suffix), 400);
        assertThat(response.get("code").asString()).isEqualTo("VALIDATION_ERROR");
        assertThat(response.get("fieldErrors").has(field)).isTrue();
    }

    @Test
    void appliesSearchAndFiltersBeforePaginationAndSortsServiceDates() throws Exception {
        JsonNode model = body(get(BASE + "?q=toyota%20camry&size=1"), 200);
        assertThat(model.get("totalElements").asInt()).isEqualTo(1);
        assertThat(model.get("items").get(0).get("id").asString()).isEqualTo("MF-001");
        JsonNode filters = body(get(BASE + "?branch=Riyadh&status=Assigned&size=1&page=1"), 200);
        assertThat(filters.get("totalElements").asInt()).isGreaterThanOrEqualTo(2);
        assertThat(filters.get("items").get(0).get("id").asString()).isEqualTo("MF-004");
        assertThat(body(get(BASE + "?q=%25"), 200).get("totalElements").asInt()).isZero();
        assertThat(body(get(BASE + "?q=mf-008"), 200).get("items").get(0).get("id").asString())
                .isEqualTo("MF-008");
        JsonNode service = body(get(BASE + "?serviceOnly=true&sort=service"), 200);
        assertThat(service.get("totalElements").asInt()).isEqualTo(3);
        assertThat(service.get("items").get(0).get("id").asString()).isEqualTo("MF-003");
        JsonNode sorted = body(get(BASE + "?size=100&sort=service"), 200).get("items");
        assertThat(sorted.get(sorted.size() - 1).get("serviceDate").asString()).isEmpty();
    }

    @Test
    void removalAndUndoChangeTheRegistryAndTheFullFleetSummary() throws Exception {
        int initial = body(get(BASE + "/summary"), 200).get("total").asInt();
        assertThat(send("DELETE", BASE + "/MF-003", null).statusCode()).isEqualTo(204);
        try {
            assertThat(body(get(BASE + "/MF-003"), 404).get("code").asString())
                    .isEqualTo("VEHICLE_NOT_FOUND");
            assertThat(body(get(BASE + "?size=1"), 200).get("totalElements").asInt())
                    .isEqualTo(initial - 1);
            JsonNode summary = body(get(BASE + "/summary"), 200);
            assertThat(summary.get("total").asInt()).isEqualTo(initial - 1);
            assertThat(summary.get("service").asInt()).isEqualTo(2);
            assertThat(body(send("POST", BASE, VALID.replace("QA 4100", "DMM 9164")), 409)
                    .get("code").asString()).isEqualTo("DUPLICATE_PLATE");
        } finally {
            assertThat(body(send("POST", BASE + "/MF-003/restore", null), 200).get("id").asString())
                    .isEqualTo("MF-003");
        }
        assertThat(body(get(BASE + "/summary"), 200).get("total").asInt()).isEqualTo(initial);
        assertThat(body(get(BASE + "/MF-003"), 200).get("id").asString()).isEqualTo("MF-003");
    }

    private HttpResponse<String> get(String path) throws Exception {
        return send("GET", path, null);
    }

    private HttpResponse<String> send(String method, String path, String payload) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path))
                .timeout(Duration.ofSeconds(10));
        if (payload == null) {
            request.method(method, HttpRequest.BodyPublishers.noBody());
        } else {
            request.header("Content-Type", "application/json")
                    .method(method, HttpRequest.BodyPublishers.ofString(payload));
        }
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private JsonNode body(HttpResponse<String> response, int status) {
        assertThat(response.statusCode()).as(response.body()).isEqualTo(status);
        return json.readTree(response.body());
    }
}
