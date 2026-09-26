CREATE DATABASE IF NOT EXISTS voting_checker;
USE voting_checker;

CREATE TABLE IF NOT EXISTS eligibility_checks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Full_name VARCHAR(255),
    Age INT,
    Country VARCHAR(100),
    Eligible BOOLEAN,
    reason VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS eligible_voters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Check_id INT,
    Full_name VARCHAR(255),
    Date_of_birth DATE,
    Age INT,
    Gender VARCHAR(50),
    Phone_number VARCHAR(15),
    Citizenship VARCHAR(100),
    State VARCHAR(100),
    District VARCHAR(100),
    City VARCHAR(100),
    Address TEXT,
    Pincode VARCHAR(10),
    Aadhar_number VARCHAR(20),
    Already_voter BOOLEAN,
    Voter_id VARCHAR(50)
);