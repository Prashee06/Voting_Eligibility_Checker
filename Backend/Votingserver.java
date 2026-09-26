import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;

import java.net.InetSocketAddress;
import java.net.URLDecoder;

import java.nio.charset.StandardCharsets;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import java.sql.SQLException;

import java.time.LocalDate;
import java.time.Period;

import java.util.HashMap;
import java.util.Map;


public class VotingServer{

    private static final String DB_URL =
            "jdbc:mysql://localhost:3306/voting_checker";

    private static final String DB_USER =
            "root";

    private static final String DB_PASSWORD =
            "Wisdomo@0415";


    public static void main(String[] args)
            throws IOException {

        HttpServer server =
                HttpServer.create(
                        new InetSocketAddress(
                                "localhost",
                                9091
                        ),
                        0
                );


        server.createContext(
                "/",
                VotingServer::home
        );


        server.createContext(
                "/check",
                VotingServer::checkEligibility
        );


        server.createContext(
                "/saveEligible",
                VotingServer::saveEligible
        );


        System.out.println(
                "=========================================="
        );

        System.out.println(
                "       VOTING ELIGIBILITY CHECKER"
        );

        System.out.println(
                "          JAVA + JDBC + MYSQL"
        );

        System.out.println(
                "=========================================="
        );

        System.out.println();

        System.out.println(
                "Server running at:"
        );

        System.out.println(
                "http://localhost:9091"
        );

        System.out.println();

        System.out.println(
                "Press Ctrl + C to stop."
        );

        System.out.println();


        server.start();
    }


    // =====================================================
    // HOME
    // =====================================================

    private static void home(
            HttpExchange exchange)
            throws IOException {

        addCorsHeaders(exchange);


        if (handleOptions(exchange)) {
            return;
        }


        String response =
                "{"
                + "\"success\":true,"
                + "\"message\":"
                + "\"Voting Eligibility Checker Java server is running.\""
                + "}";


        sendJson(
                exchange,
                200,
                response
        );
    }


    // =====================================================
    // PAGE 1 - CHECK ELIGIBILITY
    // =====================================================

    private static void checkEligibility(
            HttpExchange exchange)
            throws IOException {

        addCorsHeaders(exchange);


        if (handleOptions(exchange)) {
            return;
        }


        if (!exchange.getRequestMethod()
                .equalsIgnoreCase("POST")) {

            sendJson(
                    exchange,
                    405,
                    "{\"success\":false,"
                    + "\"message\":\"Only POST requests are allowed.\"}"
            );

            return;
        }


        try {

            String body =
                    readRequestBody(exchange);


            Map<String, String> data =
                    parseFormData(body);


            String name =
                    data.getOrDefault(
                            "name",
                            ""
                    ).trim();


            String dob =
                    data.getOrDefault(
                            "dob",
                            ""
                    ).trim();


            String country =
                    data.getOrDefault(
                            "country",
                            ""
                    ).trim();


            String citizenship =
                    data.getOrDefault(
                            "citizenship",
                            ""
                    ).trim();


            String registered =
                    data.getOrDefault(
                            "registered",
                            "No"
                    ).trim();


            // ---------------------------------------------
            // REQUIRED FIELD VALIDATION
            // ---------------------------------------------

            if (name.isEmpty()) {

                sendError(
                        exchange,
                        400,
                        "Name is required."
                );

                return;
            }


            if (dob.isEmpty()) {

                sendError(
                        exchange,
                        400,
                        "Date of birth is required."
                );

                return;
            }


            if (country.isEmpty()) {

                sendError(
                        exchange,
                        400,
                        "Country is required."
                );

                return;
            }


            if (citizenship.isEmpty()) {

                sendError(
                        exchange,
                        400,
                        "Citizenship is required."
                );

                return;
            }


            // ---------------------------------------------
            // CALCULATE AGE
            // ---------------------------------------------

            LocalDate birthDate;


            try {

                birthDate =
                        LocalDate.parse(dob);

            } catch (Exception e) {

                sendError(
                        exchange,
                        400,
                        "Invalid date of birth."
                );

                return;
            }


            if (birthDate.isAfter(
                    LocalDate.now())) {

                sendError(
                        exchange,
                        400,
                        "Date of birth cannot be in the future."
                );

                return;
            }


            int age =
                    Period.between(
                            birthDate,
                            LocalDate.now()
                    ).getYears();


            // ---------------------------------------------
            // CHECK ELIGIBILITY
            // ---------------------------------------------

            boolean eligible = true;


            String reason =
                    "You are eligible to vote.";


            if (!country.equalsIgnoreCase("India")) {

                eligible = false;

                reason =
                        "Only persons from India are eligible for this voting checker.";

            }

            else if (
                    !citizenship.equalsIgnoreCase("India")
                    &&
                    !citizenship.equalsIgnoreCase("Indian")
            ) {

                eligible = false;

                reason =
                        "Only Indian citizens are eligible to vote.";

            }

            else if (age < 18) {

                eligible = false;

                reason =
                        "You must be at least 18 years old to vote.";

            }


            // ---------------------------------------------
            // SAVE ELIGIBILITY CHECK
            // ---------------------------------------------

            int checkId =
                    saveEligibilityCheck(
                            name,
                            age,
                            country,
                            eligible,
                            reason
                    );


            // ---------------------------------------------
            // RESPONSE
            // ---------------------------------------------

            String response =
                    "{"
                    + "\"success\":true,"
                    + "\"eligible\":"
                    + eligible
                    + ","
                    + "\"checkId\":"
                    + checkId
                    + ","
                    + "\"name\":\""
                    + escapeJson(name)
                    + "\","
                    + "\"dob\":\""
                    + escapeJson(dob)
                    + "\","
                    + "\"age\":"
                    + age
                    + ","
                    + "\"country\":\""
                    + escapeJson(country)
                    + "\","
                    + "\"citizenship\":\""
                    + escapeJson(citizenship)
                    + "\","
                    + "\"registered\":\""
                    + escapeJson(registered)
                    + "\","
                    + "\"reason\":\""
                    + escapeJson(reason)
                    + "\""
                    + "}";


            sendJson(
                    exchange,
                    200,
                    response
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendError(
                    exchange,
                    500,
                    "Server error: "
                    + e.getMessage()
            );
        }
    }


    // =====================================================
    // SAVE ELIGIBILITY CHECK
    // =====================================================

    private static int saveEligibilityCheck(
            String name,
            int age,
            String country,
            boolean eligible,
            String reason)
            throws SQLException {


        String sql =
                "INSERT INTO eligibility_checks "
                + "(Full_name, Age, Country, Eligible, reason) "
                + "VALUES (?, ?, ?, ?, ?)";


        try (
                Connection connection =
                        DriverManager.getConnection(
                                DB_URL,
                                DB_USER,
                                DB_PASSWORD
                        );


                PreparedStatement statement =
                        connection.prepareStatement(
                                sql,
                                java.sql.Statement.RETURN_GENERATED_KEYS
                        )
        ) {


            statement.setString(
                    1,
                    name
            );


            statement.setInt(
                    2,
                    age
            );


            statement.setString(
                    3,
                    country
            );


            statement.setBoolean(
                    4,
                    eligible
            );


            statement.setString(
                    5,
                    reason
            );


            statement.executeUpdate();


            try (
                    ResultSet keys =
                            statement.getGeneratedKeys()
            ) {

                if (keys.next()) {

                    return keys.getInt(1);
                }
            }
        }


        throw new SQLException(
                "Could not create eligibility check."
        );
    }


    // =====================================================
    // PAGE 2 - SAVE ADDITIONAL DETAILS
    // =====================================================

    private static void saveEligible(
            HttpExchange exchange)
            throws IOException {

        addCorsHeaders(exchange);


        if (handleOptions(exchange)) {
            return;
        }


        if (!exchange.getRequestMethod()
                .equalsIgnoreCase("POST")) {

            sendError(
                    exchange,
                    405,
                    "Only POST requests are allowed."
            );

            return;
        }


        try {

            String body =
                    readRequestBody(exchange);


            Map<String, String> data =
                    parseFormData(body);


            int checkId;


            try {

                checkId =
                        Integer.parseInt(
                                data.getOrDefault(
                                        "checkId",
                                        "0"
                                )
                        );

            } catch (Exception e) {

                sendError(
                        exchange,
                        400,
                        "Invalid eligibility check ID."
                );

                return;
            }


            String name =
                    data.getOrDefault(
                            "name",
                            ""
                    ).trim();


            String dob =
                    data.getOrDefault(
                            "dob",
                            ""
                    ).trim();


            String gender =
                    data.getOrDefault(
                            "gender",
                            ""
                    ).trim();


            String phone =
                    data.getOrDefault(
                            "phone",
                            ""
                    ).trim();


            String citizenship =
                    data.getOrDefault(
                            "citizenship",
                            ""
                    ).trim();


            String state =
                    data.getOrDefault(
                            "state",
                            ""
                    ).trim();


            String district =
                    data.getOrDefault(
                            "district",
                            ""
                    ).trim();


            String city =
                    data.getOrDefault(
                            "city",
                            ""
                    ).trim();


            String address =
                    data.getOrDefault(
                            "address",
                            ""
                    ).trim();


            String pincode =
                    data.getOrDefault(
                            "pincode",
                            ""
                    ).trim();


            String aadhaar =
                    data.getOrDefault(
                            "aadhaar",
                            ""
                    ).trim();


            String registered =
                    data.getOrDefault(
                            "registered",
                            "No"
                    ).trim();


            String voterId =
                    data.getOrDefault(
                            "voterId",
                            ""
                    ).trim();


            // ---------------------------------------------
            // VALIDATION
            // ---------------------------------------------

            if (name.isEmpty()) {

                sendError(
                        exchange,
                        400,
                        "Name is required."
                );

                return;
            }


            if (dob.isEmpty()) {

                sendError(
                        exchange,
                        400,
                        "Date of birth is required."
                );

                return;
            }


            LocalDate birthDate;


            try {

                birthDate =
                        LocalDate.parse(dob);

            } catch (Exception e) {

                sendError(
                        exchange,
                        400,
                        "Invalid date of birth."
                );

                return;
            }


            int age =
                    Period.between(
                            birthDate,
                            LocalDate.now()
                    ).getYears();


            if (gender.isEmpty()) {

                sendError(
                        exchange,
                        400,
                        "Gender is required."
                );

                return;
            }


            // Phone validation

            if (!phone.matches(
                    "[6-9][0-9]{9}"
            )) {

                sendError(
                        exchange,
                        400,
                        "Invalid phone number."
                );

                return;
            }


            // Pincode validation

            if (!pincode.matches(
                    "[0-9]{6}"
            )) {

                sendError(
                        exchange,
                        400,
                        "Pincode must contain 6 digits."
                );

                return;
            }


            // Aadhaar format validation

            if (!aadhaar.matches(
                    "[0-9]{12}"
            )) {

                sendError(
                        exchange,
                        400,
                        "Aadhaar number must contain 12 digits."
                );

                return;
            }


            // Voter ID if already registered

            if (
                    registered.equalsIgnoreCase("Yes")
                    &&
                    voterId.isEmpty()
            ) {

                sendError(
                        exchange,
                        400,
                        "Voter ID is required for an already registered voter."
                );

                return;
            }


            // ---------------------------------------------
            // INSERT INTO eligible_voters
            // ---------------------------------------------

            String sql =
                    "INSERT INTO eligible_voters "
                    + "(Check_id, Full_name, Date_of_birth, Age, "
                    + "Gender, Phone_number, Citizenship, State, "
                    + "District, City, Address, Pincode, "
                    + "Aadhar_number, Already_voter, Voter_id) "
                    + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";


            try (
                    Connection connection =
                            DriverManager.getConnection(
                                    DB_URL,
                                    DB_USER,
                                    DB_PASSWORD
                            );


                    PreparedStatement statement =
                            connection.prepareStatement(sql)
            ) {


                statement.setInt(
                        1,
                        checkId
                );


                statement.setString(
                        2,
                        name
                );


                statement.setDate(
                        3,
                        java.sql.Date.valueOf(
                                birthDate
                        )
                );


                statement.setInt(
                        4,
                        age
                );


                statement.setString(
                        5,
                        gender
                );


                statement.setString(
                        6,
                        phone
                );


                statement.setString(
                        7,
                        citizenship
                );


                statement.setString(
                        8,
                        state
                );


                statement.setString(
                        9,
                        district
                );


                statement.setString(
                        10,
                        city
                );


                statement.setString(
                        11,
                        address
                );


                statement.setString(
                        12,
                        pincode
                );


                statement.setString(
                        13,
                        aadhaar
                );


                statement.setBoolean(
                        14,
                        registered.equalsIgnoreCase("Yes")
                );


                if (voterId.isEmpty()) {

                    statement.setNull(
                            15,
                            java.sql.Types.VARCHAR
                    );

                } else {

                    statement.setString(
                            15,
                            voterId
                    );
                }


                int rows =
                        statement.executeUpdate();


                if (rows > 0) {

                    String response =
                            "{"
                            + "\"success\":true,"
                            + "\"message\":"
                            + "\"Additional details saved successfully.\""
                            + "}";


                    sendJson(
                            exchange,
                            200,
                            response
                    );

                } else {

                    sendError(
                            exchange,
                            500,
                            "Details could not be saved."
                    );
                }
            }


        } catch (SQLException e) {

            e.printStackTrace();


            sendError(
                    exchange,
                    500,
                    "Database error: "
                    + e.getMessage()
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendError(
                    exchange,
                    500,
                    "Server error: "
                    + e.getMessage()
            );
        }
    }


    // =====================================================
    // READ REQUEST
    // =====================================================

    private static String readRequestBody(
            HttpExchange exchange)
            throws IOException {

        byte[] bytes =
                exchange
                        .getRequestBody()
                        .readAllBytes();


        return new String(
                bytes,
                StandardCharsets.UTF_8
        );
    }


    // =====================================================
    // PARSE FORM DATA
    // =====================================================

    private static Map<String, String> parseFormData(
            String body)
            throws Exception {

        Map<String, String> map =
                new HashMap<>();


        if (
                body == null
                ||
                body.isEmpty()
        ) {

            return map;
        }


        String[] pairs =
                body.split("&");


        for (String pair : pairs) {

            String[] parts =
                    pair.split(
                            "=",
                            2
                    );


            String key =
                    URLDecoder.decode(
                            parts[0],
                            StandardCharsets.UTF_8
                    );


            String value =
                    parts.length > 1
                            ?
                            URLDecoder.decode(
                                    parts[1],
                                    StandardCharsets.UTF_8
                            )
                            :
                            "";


            map.put(
                    key,
                    value
            );
        }


        return map;
    }


    // =====================================================
    // CORS
    // =====================================================

    private static void addCorsHeaders(
            HttpExchange exchange) {

        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Origin",
                "*"
        );


        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Methods",
                "GET, POST, OPTIONS"
        );


        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Headers",
                "Content-Type"
        );
    }


    // =====================================================
    // OPTIONS
    // =====================================================

    private static boolean handleOptions(
            HttpExchange exchange)
            throws IOException {

        if (
                exchange
                        .getRequestMethod()
                        .equalsIgnoreCase("OPTIONS")
        ) {

            exchange.sendResponseHeaders(
                    204,
                    -1
            );


            exchange.close();


            return true;
        }


        return false;
    }


    // =====================================================
    // SEND JSON
    // =====================================================

    private static void sendJson(
            HttpExchange exchange,
            int statusCode,
            String response)
            throws IOException {

        byte[] bytes =
                response.getBytes(
                        StandardCharsets.UTF_8
                );


        exchange.getResponseHeaders().set(
                "Content-Type",
                "application/json; charset=UTF-8"
        );


        exchange.sendResponseHeaders(
                statusCode,
                bytes.length
        );


        try (
                OutputStream output =
                        exchange.getResponseBody()
        ) {

            output.write(bytes);
        }
    }


    // =====================================================
    // SEND ERROR
    // =====================================================

    private static void sendError(
            HttpExchange exchange,
            int statusCode,
            String message)
            throws IOException {

        String response =
                "{"
                + "\"success\":false,"
                + "\"message\":\""
                + escapeJson(message)
                + "\""
                + "}";


        sendJson(
                exchange,
                statusCode,
                response
        );
    }


    // =====================================================
    // JSON ESCAPE
    // =====================================================

    private static String escapeJson(
            String text) {

        if (text == null) {

            return "";
        }


        return text

                .replace(
                        "\\",
                        "\\\\"
                )

                .replace(
                        "\"",
                        "\\\""
                )

                .replace(
                        "\n",
                        "\\n"
                )

                .replace(
                        "\r",
                        "\\r"
                );
    }
}