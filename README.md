# 🌍 CountriesAgent AI — Pipeline & Automation Challenge

CountriesAgent es una aplicación web de automatización inteligente y análisis geopolítico que utiliza un agente de IA para procesar, transformar y enriquecer datos de países de forma conversacional. La plataforma demuestra razonamiento multi-steap real, toma de decisiones autónoma mediante *Tool Calling* nativo y persistencia relacional atómica.

**🔗 Enlace al Proyecto:** [https://countries-agent.vercel.app/](https://countries-agent.vercel.app/)  

---

## 🚀 1. Definición del Agente y Producto

### 📌 Problema que resuelve
El análisis geopolítico y macroeconómico tradicional requiere que un consultor, inversor o persona que planea relocalizarse navegue de forma manual por múltiples fuentes de datos dispersas (población, regiones, idiomas, indicadores económicos). Este proceso manual es propenso a errores, consume tiempo y carece de una capa de contextualización inmediata. 

**CountriesAgent** Automatiza la recopilación, consolidación y análisis comparativo de datos geopolíticos y macroeconómicos, eliminando la necesidad de buscar en múltiples fuentes oficiales y redactar reportes manualmente.

### 👥 Público Objetivo
Estudiantes, investigadores, viajeros frecuentes o consultores que necesitan obtener resúmenes estructurados y comparaciones rápidas sin navegar por interfaces complejas de datos.

### 💎 Propuesta de Valor
A diferencia de un proxy genérico de OpenAI o una búsqueda tradicional en Google, CountriesAgent aporta:
1.  **Criterio Técnico:** El LLM decide autónomamente si requiere consultar fuentes externas o responder con su base de conocimiento.
2.  **Datos Verificables:** Consumo en tiempo real desde APIs externas con mecanismos anti-frágiles de tolerancia a fallos (*fallback mocks*).
3.  **Garantía de Estructura:** Respuestas 100% integras y estables gracias a la validación por JSON Schema nativo, eliminando los formatos, a veces poco estables, de la IA.

---

## 📋 2. User Stories

### User Story 1: Generación de Reporte Unificado
* **Como** analista internacional,
* **Quiero** solicitar un reporte completo de un país específico mediante lenguaje natural,
* **Para** obtener sus datos demográficos, culturales y económicos unificados en una sola vista estructurada.
* **Criterios de Aceptación:**
    * [ ] El sistema debe reconocer la intención e invocar la herramienta `get_country_report`.
    * [ ] Si la API externa no responde, el sistema debe activar un *fallback* seguro para no romper la experiencia.
    * [ ] El resultado final debe presentarse visualmente segmentado en bloques (Demografía, Cultura, Economía).

### User Story 2: Comparación Estratégica
* **Como** persona planificando una relocalización,
* **Quiero** comparar de forma directa dos países (ej. "Argentina vs España"),
* **Para** analizar cuál se adapta mejor a mis necesidades de vida y turismo.
* **Criterios de Aceptación:**
    * [ ] El agente debe extraer de forma autónoma los nombres de ambos países y ejecutar `compare_countries_recommendation`.
    * [ ] El informe resultante debe evaluar aspectos de población y emitir conclusiones lógicas no inventadas.
    * [ ] La comparación debe guardarse automáticamente en el historial de la sesión.

### User Story 3: Auditoría de Procesamiento e IA
* **Como** ingeniero o usuario técnico,
* **Quiero** inspeccionar el comportamiento interno del agente en tiempo real,
* **Para** auditar qué herramientas invocó el LLM, qué parámetros envió y qué respondió exactamente la API externa.
* **Criterios de Aceptación:**
    * [ ] La interfaz debe contar con un panel lateral derecho ("Inspector de Tools").
    * [ ] Si el turno del chat no ejecutó herramientas, el panel debe reflejar un estado vacío descriptivo.
    * [ ] Los payloads de entrada y salida deben visualizarse formateados en bloques de código legibles 

---

## 🛠️ 3. Decisiones Técnicas y Trade-offs

### 📐 Arquitectura de la Solución (Multi-step Reasoning)
Para cumplir con la regla **Anti-Proxy de OpenAI**, implemente una arquitectura de **Router & Pipeline de Dos Pasos**:
1.  **Paso 1 (Router):** El input del usuario llega a `/api/chat`. El LLM actúa como enrutador con el *System Prompt* de `ROUTER` y las herramientas configuradas (`tools.js`). El LLM evalúa y decide autónomamente si invoca una Tool o genera una respuesta libre/fuera de dominio.
2.  **Ejecución Intermedia (Lógica de Negocio):** Si se invoca una herramienta, el servidor intercepta el control, valida los argumentos del país y realiza la petición HTTP a la API externa (`safeGetCountry`). Los datos crudos se procesan localmente mediante funciones puras de JavaScript (`generateCountryReport` / `compareCountries`).
3.  **Paso 2 (Estructuración Estricta):** Con los resultados consolidados de la API, se realiza una segunda llamada a OpenAI inyectando el contexto real obtenido y forzando un formato de salida estructurado (`response_format: { type: "json_schema" }`).

### 📦 Base de Datos y Persistencia Relacional
Se seleccionó **Supabase (PostgreSQL)** por su velocidad, robustez y simplicidad. El esquema está diseñado para persistir  múltiples capas de la sesión:
* `chat_messages`: Almacena el historial lineal de la conversación (roles: `user`, `assistant` y `tool`).
* `country_reports` y `country_comparisons`: Tablas normalizadas que guardan las operaciones de negocio estructuradas de forma independiente.
* `chat_feedback`: Tabla dedicada al almacenamiento del feedback del usuario asociado de forma unívoca a la sesión e índice del mensaje.

### 🛡️ Manejo de Errores y Estrategia Anti-Frágil
* **Sanitización/Validación de Datos:** La función `sanitizeCountryName` limpia caracteres extraños y normaliza letras duplicadas causadas por tipos del usuario antes de llegar a las APIs.
* **Resiliencia Externa (Fallback Mocks):** Si la API externa experimenta un *timeout*, excede su *rate limit*, o simplemente no encuentra el país, la función catch activa de forma controlada `get_mockCountry`. Esto garantiza que el flujo de razonamiento del LLM continúe con datos consistentes en lugar de retornar un error 500.

### 🔌 Selección de APIs y el Pivote de REST Countries a API Ninjas

**¿Por qué estas Tools/APIs?**
Elegí estas herramientas porque cubren de forma directa la necesidad de consolidar datos duros globales y cruzarlos con recomendaciones analíticas sobre calidad de vida y turismo.

**El problema con REST Countries**
Mi idea inicial era usar REST Countries, pero durante el desarrollo la API presentó respuestas lentas, timeouts y caídas que rompían el flujo del agente. Para asegurar la estabilidad del proyecto, decidí cambiar a **API Ninjas (Country API)**.

**El problema de los idiomas (el 0 en lenguajes)**
Al cambiar de API apareció un nuevo problema: API Ninjas no expone un campo `languages` estructurado. Como mi lógica en JavaScript cuenta los idiomas del objeto de respuesta, al no venir ese dato el reporte mostraba `0 idiomas`.

**Cómo lo resolví**
Para que no quede un reporte con datos vacíos, delego esa parte en la segunda llamada al LLM (`SINGLE_REPORT`). Le paso los datos limpios que sí vienen de la API y dejo que el modelo, con su conocimiento general, redacte la sección de cultura e idiomas con coherencia. Es una solución temporal por restricciones de tiempo; a futuro, la mejora natural sería incorporar una fuente de datos estructurada para idiomas y reducir la dependencia del LLM para datos que deberían ser determinísticos.

**Trade-offs de los datos crudos**
El cambio de API trajo un reto adicional: API Ninjas tiene un formato de respuesta distinto y algunos campos pueden venir vacíos o con estructura variable. Para resolverlo sin impactar la experiencia del usuario, el pipeline normaliza el objeto en `safeGetCountry` antes de procesarlo, y delega en el `Assistant` la tarea de enriquecer con su conocimiento lo que falte. Esto garantiza que el usuario siempre reciba una respuesta coherente, aunque internamente los datos crudos estén incompletos.

### 📝 Ingeniería de Prompts y Estrategia Few-Shot
* **Diseño del Prompt:** El `ROUTER` está estructurado con bloques semánticos súper claros usando etiquetas tipo XML (ej: `<ejemplos_uso_tools>`). Esto delimita el contexto de manera estricta para que el modelo no se confunda entre ejecutar código o responder texto libre.
* **Estrategia Few-Shot:** Incluí ejemplos específicos para cada uno de los tres escenarios posibles (Uso de Tools, Respuesta Libre y Fuera de Dominio). Esto entrena al modelo "en el aire" para rebotar de inmediato preguntas capciosas (como que le pidan un chiste o hablar de un videojuego como *Silent Hill*) y mantener el foco geopolítico del producto.

### 🧠 Manejo de Casos Límite y Respuestas Inesperadas del LLM
* ¿Qué pasa si el LLM devuelve un formato roto? Para blindar el frontend, implementé el parámetro `response_format: { type: "json_schema" }` de OpenAI en el segundo paso del pipeline. 
* Al pasarle el esquema JSON nativo mapeado desde nuestro backend, obligamos al modelo a nivel de API a que su salida sea un JSON válido. Si el LLM intenta alucinar una estructura libre, la misma API de OpenAI lo corrige antes de que llegue a nuestra lógica de negocio.

### 📐 Schemas de Validación para Outputs Estructurados
Para asegurar que el componente dinámico del chat renderice los componentes específicos sin romper la UI, definí dos esquemas JSON estrictos en `lib/schemas.js`:
* `SingleCountryAnswerSchema`: Exige obligatoriamente las propiedades `countryName`, `demographics`, `languagesAndCulture` y `economyAndInsight`.
* `ComparisonAnswerSchema`: Exige un `summary`, `livingRecommendation` y `tourismRecommendation`.
---

## ✨ 4. Features Bonus Implementados

1.  **Panel Lateral - Inspector de Tools (Altamente Valorado):** Panel derecho interactivo (`ToolsInspector`) que expone en tiempo real el nombre de la función invocada por el modelo, los argumentos extraídos (`input`) y los datos crudos devueltos por la API (`output`).
2.  **Multi-step Reasoning Visual & UI de Estado:** Control total en el cliente sobre estados de carga (`loading`), renderizado condicional de componentes dinámicos en base a propiedades del objeto parseado (`isComparisonObject` / `isReportObject`) y scroll automático suave hacia el último mensaje.
3.  **Sistema de Feedback (Thumbs up/down):** Cada respuesta del asistente cuenta con botones interactivos para evaluar la utilidad. La calificación se guarda de forma persistente en Supabase mediante la ruta `/api/feedback`, bloqueando segundas votaciones sobre el mismo mensaje para asegurar la fidelidad de las métricas.

---

## ⚙️ 5. Instalación y Configuración Local

### Prerrequisitos
* Node.js 
* Una cuenta en Supabase con un proyecto activo.
* API Keys de OpenAI y API Ninjas.

### Pasos de Instalación

1. Clonar el repositorio:
```bash
   git clone https://github.com/tu-usuario/tu-repositorio.git
   cd tu-repositorio
```

2. Instalar las dependencias:
```bash
   npm install
```

3. Configurar las variables de entorno. Creá un archivo `.env.local` en la raíz del proyecto basándote en `.env.example`:
```env
   OPENAI_API_KEY=tu_api_key_de_openai
   NINJAS_API_KEY=tu_api_key_de_api_ninjas
   SUPABASE_URL=tu_url_de_supabase_project
   SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

4. Correr el servidor de desarrollo:
```bash
   npm run dev
```

---
## 🛑 6. Limitaciones Conocidas y Mejoras Futuras

### 🚨 Limitaciones Actuales

**Dependencia del formato de API Ninjas**
Si la API no registra un país con su nombre en inglés, el normalizador `safeGetCountry` cae directamente al mock preconfigurado, lo que puede devolver datos desactualizados o genéricos para países con nombres poco comunes.

**Falta de memoria en el agente**
El chat es stateless: cada mensaje se procesa de forma aislada, sin contexto de la conversación anterior. Si el usuario pregunta "Dame el reporte de Francia" y luego dice "¿Y cuánta población tiene?", el agente no recuerda que venían hablando de Francia y no puede relacionar ambos mensajes.

---

### 🔮 Mejoras Futuras Planeadas

**Memoria y contexto del chat**
La mejora más impactante sería que el Router y el Assistant lean los últimos mensajes guardados en la tabla `chat_messages` de Supabase antes de responder. Esto permitiría conversaciones como: *"¿Te acordás del país que te pedí antes? Comparalo con Italia"*, haciendo al agente mucho más natural y útil.

**Búsqueda avanzada en el historial**
Agregar un buscador con texto predictivo en `SidebarHistory`. Como todas las comparaciones ya se persisten en Supabase, el usuario podría filtrar por nombre de país para encontrar un informe anterior sin tener que scrollear todo el historial.

**Agregar un Caché**
Si diez personas buscan "Francia", estaría bueno guardar el resultado la primera vez y después leerlo de memoria.

## 👨‍💻 7. Nota Personal y Aprendizajes 

Este challenge significó un **enorme paso adelante en mi carrera**. Es el primer proyecto de este volumen técnica y arquitectónicamente hablando que encaro casi sin experiencia previa manejando agentes autónomos, pipelines de IA en dos pasos o conexiones complejas con Supabase. Si bien en la facultad este año estoy empezando a ver estos temas, esto sin duda fue algo muy nuevo, pero que me deja con mas ganas de seguir aprendiendo.

