-- versao-1
-- Criando o banco de dados:

## Databese: versao-01 para se criado, descomente.
--CREATE DATABASE IF NOT EXISTS `versao-01` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

#Criar Tabela de empresa:

CREATE TABLE `empresa` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

# Inserindo empresas na tabela:

INSERT INTO `empresa` VALUES 
(1,'Grafica Lelo'),
(2,'Print do Zé');

#Criar Tabela de imagem:

CREATE TABLE `imagem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `link` varchar(300) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

# Inserindo imagens na tabela:

INSERT INTO `imagem` VALUES 
(1,'./assets/img/TenisBalanciaga.jpeg'),
(2,'./assets/img/TenisCorrida.jpeg'),
(3,'./assets/img/TenisCasual.jpeg'),
(4,'./assets/img/TenisInfantil.jpeg');

#Criar Tabela de produto:

CREATE TABLE `produto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(254) NOT NULL,
  `descricao` varchar(254) NOT NULL,
  `quantidade` int NOT NULL,
  `id_empresa` int NOT NULL,
  `id_imagem` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id-empresa_idx` (`id_empresa`),
  KEY `id-imagem_idx` (`id_imagem`),
  CONSTRAINT `id-empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`),
  CONSTRAINT `id-imagem` FOREIGN KEY (`id_imagem`) REFERENCES `imagem` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Ajustando conforme a necessidade da 3 avaliação, adicionando quantidade de estoque.
# Inserindo produtos na tabela:

INSERT INTO `produto` VALUES 
(1,'Tênis Triple S Sneaker in Black','Tênis Triple S em espuma dupla preta e malha.',10,1,4),
(2,'Tênis Puma RS 3.0 Future Vintagee Azul','Tênis que mistura estilo retrô com tecnologia moderna, oferecendo conforto, respirabilidade e tração. Ideal para o dia a dia, combina com diversos estilos.',8,1,3),
(3,'Tênis Old Skool','O maior clássico da Vans, o tênis Old Skool foi o primeiro a apresentar a icônica sidestripe na lateral para o mundo.',15,1,2),
(4,'Tênis Nike Air Max Scorpion Flyknit','Tênis com amortecimento avançado, tecido leve e macio, feito com materiais reciclados e boa tração.',5,1,1),
(5,'Tênis Voador','faz você VOAR',6,2,2);

#Criar Tabela de usuario:

CREATE TABLE `usuario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(254) NOT NULL,
  `email` varchar(254) NOT NULL,
  `senha` varchar(254) NOT NULL,
  `descricao` varchar(300) DEFAULT NULL,
  `idade` int DEFAULT NULL,
  `imagem` varchar(300) DEFAULT NULL,
  `id_empresa` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_empresa_idx` (`id_empresa`),
  CONSTRAINT `id_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Ajustando conforme a necessidade da 3 avaliação, adicionando criptografia de senha.

# Inserindo usuario na tabela:

INSERT INTO `usuario` VALUES 
(1,'Gabriel Ramos','gabriel@gmail.com','$2b$10$v6vdE6r8O1qasZpi0W6hF.s6IrReeXdIcR9ov721p9PoqdMwdgFyu','CEO',21,'./assets/img/perfil-01.jpeg',1),
(2,'Lucas Lima','Lucas@gmail.com','$2b$10$Dq1gRTIl/FUj4yY16glDeeWjosFszO0Ha46EKRBPopk/I6F98z0u6','Diretor TI',22,'./assets/img/perfil-02.jpeg',2),
(3,'Luiz Fernando','Luiz@gmail.com','$2b$10$AtVHIiMeYZIVCF9O83jXmuqNV1xMtPXXBvAcqnoOKTCVUTUejzL3m','Desenvolvedor Senior',26,'./assets/img/perfil-03.jpeg',1);

-- implemtental da 3 avaliação

#Criar Tabela de cliente:

CREATE TABLE `cliente` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(250) NOT NULL,
  `email` varchar(250) NOT NULL,
  `senha` varchar(250) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

#criar Tabela de transicao:

CREATE TABLE `carrinho` (
  `id` int AUTO_INCREMENT,
  `id_cliente` int NOT NULL,
  `id_produto` int NOT NULL,
  `nome` varchar(250) NOT NULL,
  `qta_carrinho` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_cliente_idx` (`id_cliente`),
  KEY `id_produto_idx` (`id_produto`),
  CONSTRAINT `id_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id`),
  CONSTRAINT `id_produto` FOREIGN KEY (`id_produto`) REFERENCES `produto` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;