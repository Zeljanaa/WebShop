CREATE SCHEMA IF NOT EXISTS `mydb2` DEFAULT CHARACTER SET utf8 ;
USE `mydb2` ;
CREATE TABLE IF NOT EXISTS `mydb2`.`korisnici` (
  `id` INT UNIQUE AUTO_INCREMENT,
  `korisnicko_ime` VARCHAR(45) UNIQUE,
  `lozinka` TEXT NOT NULL,
  `ime` TEXT NOT NULL,
  `prezime` TEXT NOT NULL,
  `uloga` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;
CREATE TABLE IF NOT EXISTS `mydb2`.`artikli` (
  `idartikli` INT UNIQUE AUTO_INCREMENT,
  `kolicina` TEXT NOT NULL,
  `naziv` VARCHAR(45) UNIQUE,
  `opis` LONGTEXT NOT NULL,
  PRIMARY KEY (`idartikli`))
ENGINE = InnoDB;
CREATE TABLE IF NOT EXISTS `mydb2`.`prodato` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `datum` DATETIME NOT NULL,
  `kolicina` INT NOT NULL,
  `korisnici_idkorisnici` INT NULL,
  `artikli_idartikli` INT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_narucivanje_korisnici_idx` (`korisnici_idkorisnici` ASC) VISIBLE,
  INDEX `fk_narucivanje_artikli1_idx` (`artikli_idartikli` ASC) VISIBLE,
  CONSTRAINT `fk_narucivanje_korisnici`
    FOREIGN KEY (`korisnici_idkorisnici`)
    REFERENCES `mydb2`.`korisnici` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_narucivanje_artikli1`
    FOREIGN KEY (`artikli_idartikli`)
    REFERENCES `mydb2`.`artikli` (`idartikli`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB;