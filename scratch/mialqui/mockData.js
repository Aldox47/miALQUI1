const INITIAL_PROPERTIES = [
  {
    id: 1,
    title: "Departamento Moderno en el Centro",
    category: "Departamentos",
    type: "alquiler",
    price: 1800000, // Alquiler mensual realista: 1.800.000 Gs./mes
    phone: "595981234567",
    description: "Hermoso departamento amoblado en pleno centro de Coronel Oviedo. A pasos de la Catedral, supermercados y restaurantes. Cuenta con aire acondicionado, cama matrimonial de primera calidad, cocina equipada y balcón con vista a la ciudad. Ideal para parejas o viajeros de negocios.",
    location: "Centro, Coronel Oviedo",
    lat: -25.4452,
    lng: -56.4402,
    rating: 4.9,
    reviewsCount: 14,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Wifi de Alta Velocidad", "Aire Acondicionado", "Cocina Completa", "Smart TV", "Estacionamiento Gratuito", "Lavadora"]
  },
  {
    id: 2,
    title: "Cabaña Rústica 'El Refugio' con Piscina",
    category: "Casas",
    type: "alquiler",
    price: 3500000, // Alquiler mensual realista: 3.500.000 Gs./mes
    phone: "595982111222",
    description: "Desconectate del ruido de la ciudad en esta encantadora cabaña rústica ubicada en las afueras de Oviedo, cerca de la UNVES. Amplio jardín arbolado, piscina privada para refrescarse, parrilla para el asado del domingo y un quincho super acogedor. Totalmente equipada para disfrutar con amigos o familia.",
    location: "Zona UNVES, Coronel Oviedo",
    lat: -25.4605,
    lng: -56.4275,
    rating: 4.8,
    reviewsCount: 22,
    images: [
      "https://images.unsplash.com/photo-1587080266227-677cd237c267?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1611048267451-e6ed903d4a38?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Piscina Privada", "Parrilla / Quincho", "Amplio Jardín", "Aire Acondicionado", "Wifi", "Cochera para 3 autos", "Pet Friendly"]
  },
  {
    id: 3,
    title: "Casa Familiar en Barrio Espínola - Venta",
    category: "Casas",
    type: "venta",
    price: 320000000, // Venta de casa en Guaraníes: 320 millones Gs.
    phone: "595983333444",
    description: "Espaciosa casa familiar en venta, ubicada en el tranquilo Barrio Espínola de Coronel Oviedo. Cuenta con 3 dormitorios, sala de estar amplia, patio trasero ideal para ampliaciones y cochera techada. Totalmente amurallada, con todos los servicios activos y título de propiedad listo para transferir.",
    location: "Barrio Espínola, Coronel Oviedo",
    lat: -25.4385,
    lng: -56.4520,
    rating: 4.7,
    reviewsCount: 9,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["3 Dormitorios", "Patio Amplio", "Cochera Techada", "Wifi", "Smart TV con Netflix", "Cocina Equipada", "Lavadora"]
  },
  {
    id: 4,
    title: "Loft Minimalista Premium - Cerca de la Rotonda",
    category: "Habitaciones",
    type: "alquiler",
    price: 2200000, // Alquiler mensual: 2.200.000 Gs./mes
    phone: "595984555666",
    description: "Loft de concepto abierto con diseño minimalista premium, a minutos de la rotonda de Coronel Oviedo. Acabados de lujo, iluminación LED regulable, Smart TV de 55 pulgadas, cama King Size muy cómoda y cocina con barra americana. Excelente aislamiento acústico e ideal para ejecutivos.",
    location: "Cruce/Rotonda, Coronel Oviedo",
    lat: -25.4522,
    lng: -56.4498,
    rating: 5.0,
    reviewsCount: 18,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Wifi de Fibra Óptica", "Smart TV 55'", "Aire Acondicionado", "Cama King Size", "Cochera Privada", "Cerradura Digital"]
  },
  {
    id: 5,
    title: "Quinta Campestre 'El Remanso' de Oviedo - Venta",
    category: "Casas",
    type: "venta",
    price: 750000000, // Venta de Quinta en Guaraníes: 750 millones Gs.
    phone: "595985777888",
    description: "Espectacular quinta de 1 hectárea en venta. Totalmente parquizada, piscina olímpica, cancha de fútbol, quincho gigante con tatakua y parrilla. La casa principal cuenta con 4 dormitorios climatizados. Propiedad ideal para inversión turística, eventos o casa de campo familiar. Papeles e impuestos al día.",
    location: "Ruta 2 Km 135, Coronel Oviedo",
    lat: -25.4680,
    lng: -56.4020,
    rating: 4.9,
    reviewsCount: 31,
    images: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Piscina Olímpica", "Cancha de Fútbol", "Quincho con Tatakua", "Capacidad 12+ personas", "Parque Infantil", "Aire Acondicionado", "Estacionamiento para 10+ autos"]
  },
  {
    id: 6,
    title: "Duplex Moderno a Estrenar - Barrio Azucena",
    category: "Casas",
    type: "venta",
    price: 480000000, // 480 millones Gs.
    phone: "595981234567",
    description: "Hermoso duplex moderno a estrenar en Barrio Azucena. Cuenta con 2 plantas, 3 habitaciones (1 en suite), sala de estar climatizada, cocina integrada con muebles de alta gama, quincho con parrilla y cochera para 2 vehículos. Zona residencial de alto crecimiento, a minutos del centro de la ciudad.",
    location: "Barrio Azucena, Coronel Oviedo",
    lat: -25.4510,
    lng: -56.4350,
    rating: 4.8,
    reviewsCount: 4,
    images: [
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["A Estrenar", "3 Habitaciones", "Quincho con Parrilla", "Cochera para 2 autos", "Portón Eléctrico", "Aire Acondicionado"]
  },
  {
    id: 7,
    title: "Departamento Monoambiente Premium - Edificio Ovetense",
    category: "Departamentos",
    type: "venta",
    price: 185000000, // 185 millones Gs.
    phone: "595982111222",
    description: "Excelente oportunidad de inversión en Barrio San José. Departamento monoambiente premium en edificio a estrenar. Ideal para alquilar a estudiantes universitarios de la zona. Incluye cocina amoblada con anafe, extractor, baño moderno, placard empotrado y balcón con excelente iluminación natural.",
    location: "Barrio San José, Coronel Oviedo",
    lat: -25.4415,
    lng: -56.4462,
    rating: 5.0,
    reviewsCount: 2,
    images: [
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Balcón Privado", "Seguridad 24hs", "Ascensor", "Cocina Equipada", "Placard Empotrado", "Aire Acondicionado"]
  },
  {
    id: 8,
    title: "Mansión Colonial con Amplio Parque - Zona Céntrica",
    category: "Casas",
    type: "venta",
    price: 1250000000, // 1.250 millones Gs.
    phone: "595983333444",
    description: "Espectacular residencia señorial de estilo colonial en pleno centro de Coronel Oviedo. Construida sobre un inmenso terreno de 2.000 m2. Amplias salas de estar con chimenea, 5 dormitorios en suite, biblioteca, piscina rodeada de vegetación, quincho con tatakua original, área de servicio completa y estacionamiento techado.",
    location: "Centro, Coronel Oviedo",
    lat: -25.4485,
    lng: -56.4428,
    rating: 4.9,
    reviewsCount: 7,
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Piscina", "Quincho con Tatakua", "Parque Gigante", "Chimenea", "5 Dormitorios en Suite", "Estacionamiento para 6+ autos", "Biblioteca"]
  }
];
