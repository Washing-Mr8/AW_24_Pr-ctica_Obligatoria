-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 25-11-2024 a las 21:54:27
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `aw_24`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion_accesibilidad`
--

CREATE TABLE `configuracion_accesibilidad` (
  `ID` int(11) NOT NULL,
  `Paleta_Colores` varchar(255) DEFAULT NULL,
  `Tamano_Texto` varchar(50) DEFAULT NULL,
  `Configuracion_Navegacion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `configuracion_accesibilidad`
--

INSERT INTO `configuracion_accesibilidad` (`ID`, `Paleta_Colores`, `Tamano_Texto`, `Configuracion_Navegacion`) VALUES
(1, '[value-2]', '[value-3]', '[value-4]');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos`
--

CREATE TABLE `eventos` (
  `ID` int(11) NOT NULL,
  `Titulo` varchar(255) NOT NULL,
  `Descripcion` text DEFAULT NULL,
  `Fecha` date NOT NULL,
  `Hora` time NOT NULL,
  `Ubicacion` varchar(255) DEFAULT NULL,
  `Capacidad_Maxima` int(11) NOT NULL,
  `tipo` set('seminario','taller','conferencia') NOT NULL,
  `Duracion` int(11) NOT NULL,
  `Capacidad_Actual` int(11) NOT NULL,
  `IDfacultad` int(11) NOT NULL,
  `facultad` varchar(255) NOT NULL,
  `Organizador_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `eventos`
--

INSERT INTO `eventos` (`ID`, `Titulo`, `Descripcion`, `Fecha`, `Hora`, `Ubicacion`, `Capacidad_Maxima`, `tipo`, `Duracion`, `Capacidad_Actual`, `IDfacultad`, `facultad`, `Organizador_ID`) VALUES
(18, 'Evento 1', '1212', '2024-11-13', '00:55:00', 'Aula 1', 123, 'taller', 123, 0, 2, 'Medicina', 2),
(19, 'a', '1', '2024-11-01', '00:56:00', 'a', 1, 'taller', 1, 0, 1, 'Informática', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `facultades`
--

CREATE TABLE `facultades` (
  `ID` int(11) NOT NULL,
  `Nombre` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `facultades`
--

INSERT INTO `facultades` (`ID`, `Nombre`) VALUES
(1, 'Informática'),
(2, 'Medicina');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inscripciones`
--

CREATE TABLE `inscripciones` (
  `Usuario_ID` int(11) NOT NULL,
  `Evento_ID` int(11) NOT NULL,
  `Estado_Inscripcion` enum('inscrito','lista de espera') NOT NULL,
  `Fecha_Inscripcion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `ID` int(11) NOT NULL,
  `Nombre` varchar(255) NOT NULL,
  `Correo` varchar(255) NOT NULL,
  `Telefono` varchar(15) DEFAULT NULL,
  `Facultad_ID` int(11) DEFAULT NULL,
  `Rol` enum('organizador','asistente') NOT NULL,
  `Configuraciones_ID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`ID`, `Nombre`, `Correo`, `Telefono`, `Facultad_ID`, `Rol`, `Configuraciones_ID`) VALUES
(1, '[value-2]', '[value-3]', '[value-4]', 1, 'organizador', 1),
(2, 'Pedrito', 'uncorrer@sisi.com', '123456789', 2, 'organizador', 1),
(3, 'Pepe', 'asasas@sisi.com', '123456789', 2, 'organizador', 1),
(4, 'asistente', 'unacorrer@sisi.com', '123456789', 2, 'asistente', 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `configuracion_accesibilidad`
--
ALTER TABLE `configuracion_accesibilidad`
  ADD PRIMARY KEY (`ID`);

--
-- Indices de la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `Organizador_ID` (`Organizador_ID`),
  ADD KEY `eventos_ibfk_2` (`IDfacultad`);

--
-- Indices de la tabla `facultades`
--
ALTER TABLE `facultades`
  ADD PRIMARY KEY (`ID`);

--
-- Indices de la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  ADD PRIMARY KEY (`Usuario_ID`,`Evento_ID`),
  ADD KEY `Evento_ID` (`Evento_ID`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `Correo` (`Correo`),
  ADD KEY `Facultad_ID` (`Facultad_ID`),
  ADD KEY `Configuraciones_ID` (`Configuraciones_ID`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `configuracion_accesibilidad`
--
ALTER TABLE `configuracion_accesibilidad`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `eventos`
--
ALTER TABLE `eventos`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `facultades`
--
ALTER TABLE `facultades`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD CONSTRAINT `eventos_ibfk_1` FOREIGN KEY (`Organizador_ID`) REFERENCES `usuarios` (`ID`),
  ADD CONSTRAINT `eventos_ibfk_2` FOREIGN KEY (`IDfacultad`) REFERENCES `facultades` (`ID`);

--
-- Filtros para la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  ADD CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`Usuario_ID`) REFERENCES `usuarios` (`ID`),
  ADD CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`Evento_ID`) REFERENCES `eventos` (`ID`);

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`Facultad_ID`) REFERENCES `facultades` (`ID`),
  ADD CONSTRAINT `usuarios_ibfk_2` FOREIGN KEY (`Configuraciones_ID`) REFERENCES `configuracion_accesibilidad` (`ID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
