select version();
create database voting_checker;
use voting_checker;
create table eligibility_checks(check_id INT AUTO_INCREMENT primary key,Full_name varchar(100)not null,Age INT not null,Country varchar(100) not null,Eligible boolean not null,reason varchar(255) not null,Checked_at timestamp default current_timestamp);
create table eligible_voters(Voter_record_id int auto_increment primary key,Check_id int not null,Full_name varchar(100) not null,Date_of_birth date not null,Age int not null,Gender varchar(20),Phone_number varchar(15)not null,Citizenship varchar(100)not null,State varchar(100),District varchar(100),City varchar(100),Address varchar(255),Pincode varchar(10),Aadhar_number varchar(12)not null,Already_voter boolean not null,Voter_id varchar(20),checked_at timestamp default current_timestamp,foreign key(Check_id)references Eligibility_checks(Check_id));
use voting_checker;
show tables;
DESCRIBE eligibility_checks;

DESCRIBE eligible_voters;

SELECT * FROM eligibility_checks;
SELECT * FROM eligible_voters;