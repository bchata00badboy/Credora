--
-- PostgreSQL database dump
--

\restrict cwTxvuiOs906rqDNzAX6tZSleFEPYNPWjisPtJlUIMpmHdEj14fHisMAsQ9FeFL

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-01-08 12:26:26

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 872 (class 1247 OID 32935)
-- Name: estado_kyc_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_kyc_enum AS ENUM (
    'PENDIENTE_VERIFICACION',
    'PENDIENTE_OCR',
    'RECHAZADO',
    'APROBADO'
);


--
-- TOC entry 899 (class 1247 OID 33094)
-- Name: estadokyc; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estadokyc AS ENUM (
    'PENDIENTE_VERIFICACION',
    'PENDIENTE_OCR',
    'RECHAZADO',
    'APROBADO'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 32963)
-- Name: categoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categoria (
    id_categoria integer NOT NULL,
    nombre character varying(50) NOT NULL,
    tipo character varying(15) NOT NULL,
    CONSTRAINT categoria_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['Ingreso'::character varying, 'Egreso'::character varying])::text[])))
);


--
-- TOC entry 223 (class 1259 OID 32962)
-- Name: categoria_id_categoria_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categoria_id_categoria_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5113 (class 0 OID 0)
-- Dependencies: 223
-- Name: categoria_id_categoria_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categoria_id_categoria_seq OWNED BY public.categoria.id_categoria;


--
-- TOC entry 236 (class 1259 OID 33081)
-- Name: contenidoeducativo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contenidoeducativo (
    id_contenido integer NOT NULL,
    titulo character varying(100) NOT NULL,
    cuerpo_texto text,
    nivel_dificultad character varying(20),
    puntos_recompensa integer DEFAULT 10
);


--
-- TOC entry 235 (class 1259 OID 33080)
-- Name: contenidoeducativo_id_contenido_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contenidoeducativo_id_contenido_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5114 (class 0 OID 0)
-- Dependencies: 235
-- Name: contenidoeducativo_id_contenido_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contenidoeducativo_id_contenido_seq OWNED BY public.contenidoeducativo.id_contenido;


--
-- TOC entry 226 (class 1259 OID 32976)
-- Name: cuenta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuenta (
    id_cuenta integer NOT NULL,
    id_usuario integer NOT NULL,
    saldo numeric(15,2) DEFAULT 0.00 NOT NULL,
    moneda character varying(3) DEFAULT 'USD'::character varying,
    fecha_creacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 225 (class 1259 OID 32975)
-- Name: cuenta_id_cuenta_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cuenta_id_cuenta_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5115 (class 0 OID 0)
-- Dependencies: 225
-- Name: cuenta_id_cuenta_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cuenta_id_cuenta_seq OWNED BY public.cuenta.id_cuenta;


--
-- TOC entry 220 (class 1259 OID 32882)
-- Name: documentovalidacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentovalidacion (
    id_documento integer NOT NULL,
    id_usuario integer NOT NULL,
    ruta_archivo character varying(255) NOT NULL,
    tipo_documento character varying(20) DEFAULT 'Cedula'::character varying,
    datos_ocr_json jsonb,
    estado_validacion character varying(20) DEFAULT 'Pendiente'::character varying,
    fecha_subida timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 219 (class 1259 OID 32881)
-- Name: documentovalidacion_id_documento_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.documentovalidacion_id_documento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5116 (class 0 OID 0)
-- Dependencies: 219
-- Name: documentovalidacion_id_documento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.documentovalidacion_id_documento_seq OWNED BY public.documentovalidacion.id_documento;


--
-- TOC entry 228 (class 1259 OID 32996)
-- Name: metafinanciera; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metafinanciera (
    id_meta integer NOT NULL,
    id_usuario integer NOT NULL,
    nombre_meta character varying(100) NOT NULL,
    monto_objetivo numeric(15,2) NOT NULL,
    monto_actual numeric(15,2) DEFAULT 0.00 NOT NULL,
    fecha_limite date,
    estado character varying(20) DEFAULT 'En Progreso'::character varying
);


--
-- TOC entry 227 (class 1259 OID 32995)
-- Name: metafinanciera_id_meta_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.metafinanciera_id_meta_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5117 (class 0 OID 0)
-- Dependencies: 227
-- Name: metafinanciera_id_meta_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.metafinanciera_id_meta_seq OWNED BY public.metafinanciera.id_meta;


--
-- TOC entry 230 (class 1259 OID 33015)
-- Name: negocio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.negocio (
    id_negocio integer NOT NULL,
    id_usuario_dueno integer,
    nombre_publico character varying(100) NOT NULL,
    tipo_negocio character varying(50),
    cuenta_destino character varying(50)
);


--
-- TOC entry 229 (class 1259 OID 33014)
-- Name: negocio_id_negocio_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.negocio_id_negocio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 229
-- Name: negocio_id_negocio_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.negocio_id_negocio_seq OWNED BY public.negocio.id_negocio;


--
-- TOC entry 234 (class 1259 OID 33059)
-- Name: solicitudkyc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudkyc (
    id_documento integer NOT NULL,
    id_usuario integer NOT NULL,
    nombre_archivo_seguro character varying(255) NOT NULL,
    datos_ocr_json jsonb,
    estado public.estado_kyc_enum DEFAULT 'PENDIENTE_OCR'::public.estado_kyc_enum NOT NULL,
    fecha_subida timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 233 (class 1259 OID 33058)
-- Name: solicitudkyc_id_documento_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solicitudkyc_id_documento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 233
-- Name: solicitudkyc_id_documento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solicitudkyc_id_documento_seq OWNED BY public.solicitudkyc.id_documento;


--
-- TOC entry 232 (class 1259 OID 33029)
-- Name: transaccion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaccion (
    id_transaccion integer NOT NULL,
    id_usuario integer NOT NULL,
    id_categoria integer NOT NULL,
    id_negocio integer,
    monto numeric(15,2) NOT NULL,
    descripcion text,
    fecha_transaccion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transaccion_monto_check CHECK ((monto > (0)::numeric))
);


--
-- TOC entry 231 (class 1259 OID 33028)
-- Name: transaccion_id_transaccion_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transaccion_id_transaccion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 231
-- Name: transaccion_id_transaccion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transaccion_id_transaccion_seq OWNED BY public.transaccion.id_transaccion;


--
-- TOC entry 222 (class 1259 OID 32944)
-- Name: usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario (
    id_usuario integer NOT NULL,
    nombre_completo character varying(100) NOT NULL,
    correo character varying(100) NOT NULL,
    hash_contrasena character varying(255) NOT NULL,
    fecha_registro timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    direccion text,
    telefono character varying(20),
    ocupacion character varying(50),
    nivel_estudio character varying(50),
    es_cuenta_negocio boolean DEFAULT false,
    estado_kyc public.estado_kyc_enum DEFAULT 'PENDIENTE_VERIFICACION'::public.estado_kyc_enum NOT NULL
);


--
-- TOC entry 221 (class 1259 OID 32943)
-- Name: usuario_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuario_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 221
-- Name: usuario_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuario_id_usuario_seq OWNED BY public.usuario.id_usuario;


--
-- TOC entry 4910 (class 2604 OID 32966)
-- Name: categoria id_categoria; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria ALTER COLUMN id_categoria SET DEFAULT nextval('public.categoria_id_categoria_seq'::regclass);


--
-- TOC entry 4924 (class 2604 OID 33084)
-- Name: contenidoeducativo id_contenido; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contenidoeducativo ALTER COLUMN id_contenido SET DEFAULT nextval('public.contenidoeducativo_id_contenido_seq'::regclass);


--
-- TOC entry 4911 (class 2604 OID 32979)
-- Name: cuenta id_cuenta; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta ALTER COLUMN id_cuenta SET DEFAULT nextval('public.cuenta_id_cuenta_seq'::regclass);


--
-- TOC entry 4902 (class 2604 OID 32885)
-- Name: documentovalidacion id_documento; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentovalidacion ALTER COLUMN id_documento SET DEFAULT nextval('public.documentovalidacion_id_documento_seq'::regclass);


--
-- TOC entry 4915 (class 2604 OID 32999)
-- Name: metafinanciera id_meta; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metafinanciera ALTER COLUMN id_meta SET DEFAULT nextval('public.metafinanciera_id_meta_seq'::regclass);


--
-- TOC entry 4918 (class 2604 OID 33018)
-- Name: negocio id_negocio; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.negocio ALTER COLUMN id_negocio SET DEFAULT nextval('public.negocio_id_negocio_seq'::regclass);


--
-- TOC entry 4921 (class 2604 OID 33062)
-- Name: solicitudkyc id_documento; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudkyc ALTER COLUMN id_documento SET DEFAULT nextval('public.solicitudkyc_id_documento_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 33032)
-- Name: transaccion id_transaccion; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaccion ALTER COLUMN id_transaccion SET DEFAULT nextval('public.transaccion_id_transaccion_seq'::regclass);


--
-- TOC entry 4906 (class 2604 OID 32947)
-- Name: usuario id_usuario; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuario_id_usuario_seq'::regclass);


--
-- TOC entry 4935 (class 2606 OID 32974)
-- Name: categoria categoria_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria
    ADD CONSTRAINT categoria_nombre_key UNIQUE (nombre);


--
-- TOC entry 4937 (class 2606 OID 32972)
-- Name: categoria categoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria
    ADD CONSTRAINT categoria_pkey PRIMARY KEY (id_categoria);


--
-- TOC entry 4953 (class 2606 OID 33091)
-- Name: contenidoeducativo contenidoeducativo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contenidoeducativo
    ADD CONSTRAINT contenidoeducativo_pkey PRIMARY KEY (id_contenido);


--
-- TOC entry 4939 (class 2606 OID 32989)
-- Name: cuenta cuenta_id_usuario_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta
    ADD CONSTRAINT cuenta_id_usuario_key UNIQUE (id_usuario);


--
-- TOC entry 4941 (class 2606 OID 32987)
-- Name: cuenta cuenta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta
    ADD CONSTRAINT cuenta_pkey PRIMARY KEY (id_cuenta);


--
-- TOC entry 4929 (class 2606 OID 32895)
-- Name: documentovalidacion documentovalidacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentovalidacion
    ADD CONSTRAINT documentovalidacion_pkey PRIMARY KEY (id_documento);


--
-- TOC entry 4943 (class 2606 OID 33008)
-- Name: metafinanciera metafinanciera_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metafinanciera
    ADD CONSTRAINT metafinanciera_pkey PRIMARY KEY (id_meta);


--
-- TOC entry 4945 (class 2606 OID 33022)
-- Name: negocio negocio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.negocio
    ADD CONSTRAINT negocio_pkey PRIMARY KEY (id_negocio);


--
-- TOC entry 4949 (class 2606 OID 33074)
-- Name: solicitudkyc solicitudkyc_nombre_archivo_seguro_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudkyc
    ADD CONSTRAINT solicitudkyc_nombre_archivo_seguro_key UNIQUE (nombre_archivo_seguro);


--
-- TOC entry 4951 (class 2606 OID 33072)
-- Name: solicitudkyc solicitudkyc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudkyc
    ADD CONSTRAINT solicitudkyc_pkey PRIMARY KEY (id_documento);


--
-- TOC entry 4947 (class 2606 OID 33042)
-- Name: transaccion transaccion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaccion
    ADD CONSTRAINT transaccion_pkey PRIMARY KEY (id_transaccion);


--
-- TOC entry 4931 (class 2606 OID 32961)
-- Name: usuario usuario_correo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_correo_key UNIQUE (correo);


--
-- TOC entry 4933 (class 2606 OID 32959)
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 4954 (class 2606 OID 32990)
-- Name: cuenta cuenta_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta
    ADD CONSTRAINT cuenta_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- TOC entry 4955 (class 2606 OID 33009)
-- Name: metafinanciera metafinanciera_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metafinanciera
    ADD CONSTRAINT metafinanciera_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- TOC entry 4956 (class 2606 OID 33023)
-- Name: negocio negocio_id_usuario_dueno_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.negocio
    ADD CONSTRAINT negocio_id_usuario_dueno_fkey FOREIGN KEY (id_usuario_dueno) REFERENCES public.usuario(id_usuario);


--
-- TOC entry 4960 (class 2606 OID 33075)
-- Name: solicitudkyc solicitudkyc_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudkyc
    ADD CONSTRAINT solicitudkyc_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- TOC entry 4957 (class 2606 OID 33048)
-- Name: transaccion transaccion_id_categoria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaccion
    ADD CONSTRAINT transaccion_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categoria(id_categoria);


--
-- TOC entry 4958 (class 2606 OID 33053)
-- Name: transaccion transaccion_id_negocio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaccion
    ADD CONSTRAINT transaccion_id_negocio_fkey FOREIGN KEY (id_negocio) REFERENCES public.negocio(id_negocio);


--
-- TOC entry 4959 (class 2606 OID 33043)
-- Name: transaccion transaccion_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaccion
    ADD CONSTRAINT transaccion_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


-- Completed on 2026-01-08 12:26:27

--
-- PostgreSQL database dump complete
--

\unrestrict cwTxvuiOs906rqDNzAX6tZSleFEPYNPWjisPtJlUIMpmHdEj14fHisMAsQ9FeFL

