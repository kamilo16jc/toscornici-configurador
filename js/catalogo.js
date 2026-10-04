// GENERATO AUTOMATICAMENTE da tools/generate-catalog.mjs — non modificare a mano.
// Fonte: porte tracciate (.json) + manual-configurador/modelos (.md). Rigenerare con:
//   node tools/generate-catalog.mjs
//
// ATTENZIONE: i modelli con "linea": "Da prezzare" e "id": null sono entrati da
// ~/Documents/JSON DOOR SENZA scheda .md, quindi con listino a zero. Rigenerare
// con generate-catalog.mjs li FA SPARIRE (senza .md vengono saltati).
// Precios de los modelos que estaban a cero: tools/inyecta-precios.mjs (listino 2025).
export const MODELLI = {
  "alessandria": {
    "label": "Alessandria",
    "id": 2500,
    "linea": "Base",
    "sub": "Linea Base · ID 2500",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/alessandria.json?v=674f1a12",
    "pezzi": 6,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 840,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1113,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 775,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1027,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 582,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 854,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 623,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 884,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 854,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "barletta": {
    "label": "Barletta",
    "id": 1100,
    "linea": "Base",
    "sub": "Linea Base · ID 1100",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/barletta.json?v=7eab6f54",
    "pezzi": 25,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 595,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 268,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 798,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 337,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 550,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 247,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 737,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 311,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 452,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 238,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 634,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 310,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 431,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 224,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 601,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 304,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 634,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 310,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "canterbury": {
    "label": "Canterbury",
    "id": 4900,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 4900",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/canterbury.json?v=b19feeaf",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1088,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1381,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1004,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1274,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 804,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1066,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 787,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1066,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1066,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "catania": {
    "label": "Catania",
    "id": 1200,
    "linea": "Base",
    "sub": "Linea Base · ID 1200",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/catania.json?v=04cdf490",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 595,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 798,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 550,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 737,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 452,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 634,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 431,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 601,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 634,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "enna": {
    "label": "Enna",
    "id": 400,
    "linea": "Base",
    "sub": "Linea Base · ID 400",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/enna.json?v=604abebb",
    "pezzi": 19,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1021,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1280,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 944,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1182,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 768,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1020,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 656,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 932,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1020,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "faenza": {
    "label": "Faenza",
    "id": 600,
    "linea": "Base",
    "sub": "Linea Base · ID 600",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/faenza.json?v=34aba641",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 702,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 923,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 648,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 852,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 494,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 667,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 478,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 721,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 667,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "firenze": {
    "label": "Firenze",
    "id": 500,
    "linea": "Base",
    "sub": "Linea Base · ID 500",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/firenze.json?v=6752f1cc",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 702,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 923,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 648,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 852,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 494,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 667,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 478,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 721,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 667,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "latina": {
    "label": "Latina",
    "id": 800,
    "linea": "Base",
    "sub": "Linea Base · ID 800",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/latina.json?v=c20ac4b4",
    "pezzi": 11,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 843,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1096,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 778,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1012,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 603,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 833,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 525,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 769,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 833,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "manchester": {
    "label": "Manchester",
    "id": 4700,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 4700",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/manchester.json?v=57750ac3",
    "pezzi": 5,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + vano vetro intero"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 636,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 927,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 587,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 856,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 503,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 764,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 532,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 802,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 764,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "materas": {
    "label": "Matera-S",
    "id": 5960,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5960",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/materas.json?v=dfdb189d",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1509,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1776,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1393,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1639,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1270,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1511,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1210,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1459,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1511,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "matera": {
    "label": "Matera",
    "id": 5950,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5950",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/matera.json?v=ba3dd2b0",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1509,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1776,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1393,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1639,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1270,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1511,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1210,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1459,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1511,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "mantova": {
    "label": "Mantova",
    "id": 700,
    "linea": "Base",
    "sub": "Linea Base · ID 700",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/mantova.json?v=5853be77",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 702,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 923,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 648,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 852,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 494,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 667,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 478,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 721,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 667,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "newengland": {
    "label": "New England",
    "id": 4500,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 4500",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/newengland.json?v=9d61a2e9",
    "pezzi": 5,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 923,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1216,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 852,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1122,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 673,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 934,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 677,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 947,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 934,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "pausania": {
    "label": "Pausania",
    "id": 1400,
    "linea": "Base",
    "sub": "Linea Base · ID 1400",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/pausania.json?v=51ed480f",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + vano vetro intero"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 395,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 185,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 612,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 326,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 365,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 170,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 565,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 301,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 302,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 160,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 480,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 288,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 298,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 145,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 532,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 272,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 480,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 288,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "piccadilly": {
    "label": "Piccadilly",
    "id": 4600,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 4600",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/piccadilly.json?v=4e30fa3f",
    "pezzi": 7,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 923,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1216,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 852,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1122,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 673,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 934,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 677,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 947,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 934,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "potenza": {
    "label": "Potenza",
    "id": 5900,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5900",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/potenza.json?v=14c449fd",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1309,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1573,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1209,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1452,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1053,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1292,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 986,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1231,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1292,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "piacenza": {
    "label": "Piacenza",
    "id": 900,
    "linea": "Base",
    "sub": "Linea Base · ID 900",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/piacenza.json?v=d563002f",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 843,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1096,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 778,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1012,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 603,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 833,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 525,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 769,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 833,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "pienza": {
    "label": "Pienza",
    "id": 1000,
    "linea": "Base",
    "sub": "Linea Base · ID 1000",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/pienza.json?v=fa87316f",
    "pezzi": 7,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 843,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1096,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 778,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1012,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 603,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 833,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 525,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 769,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 833,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "pisa": {
    "label": "Pisa",
    "id": 750,
    "linea": "Base",
    "sub": "Linea Base · ID 750",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/pisa.json?v=31af0524",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 702,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 923,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 648,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 852,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 494,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 667,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 478,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 721,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 667,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "ragusa": {
    "label": "Ragusa",
    "id": 300,
    "linea": "Base",
    "sub": "Linea Base · ID 300",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/ragusa.json?v=16a05d68",
    "pezzi": 13,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1021,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1280,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 944,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1182,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 768,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1020,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 656,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 932,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1020,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "roma": {
    "label": "Roma",
    "id": 200,
    "linea": "Base",
    "sub": "Linea Base · ID 200",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/roma.json?v=399d034c",
    "pezzi": 15,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1021,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1280,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 944,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1182,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 768,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1020,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 656,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 932,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1020,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "siena": {
    "label": "Siena",
    "id": 100,
    "linea": "Base",
    "sub": "Linea Base · ID 100",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/siena.json?v=f24fc1aa",
    "pezzi": 7,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 648,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 864,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 597,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 798,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 450,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 623,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 434,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 670,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 623,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "timesquare": {
    "label": "Time Square",
    "id": 5600,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5600",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/timesquare.json?v=f6fa2491",
    "pezzi": 11,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 754,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 129,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 974,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 185,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 696,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 119,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 899,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 170,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 578,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 109,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 780,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 157,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 579,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 98,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 808,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 142,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 780,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 157,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "vercelli": {
    "label": "Vercelli",
    "id": 2400,
    "linea": "Base",
    "sub": "Linea Base · ID 2400",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/vercelli.json?v=bc63ac65",
    "pezzi": 6,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + vano vetro intero"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 560,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 836,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 517,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 772,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 419,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 692,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 484,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 740,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 692,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "windsor": {
    "label": "Windsor",
    "id": 4800,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 4800",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/windsor.json?v=b60855dc",
    "pezzi": 11,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1088,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1381,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1004,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1274,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 804,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1066,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 787,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1066,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1066,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "carrara": {
    "label": "Carrara",
    "id": 2000,
    "linea": "Base",
    "sub": "Linea Base · ID 2000",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/carrara.json?v=4b0ee1a4",
    "pezzi": 7,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 497,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 758,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 458,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 700,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 367,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 576,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 348,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 564,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 576,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "genova": {
    "label": "Genova",
    "id": 2100,
    "linea": "Base",
    "sub": "Linea Base · ID 2100",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/genova.json?v=0b7668e0",
    "pezzi": 15,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 497,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 227,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 758,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 296,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 458,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 210,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 700,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 274,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 367,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 193,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 576,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 265,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 348,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 181,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 564,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 247,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 576,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 265,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "imperia": {
    "label": "Imperia",
    "id": 1800,
    "linea": "Base",
    "sub": "Linea Base · ID 1800",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/imperia.json?v=3576b4bb",
    "pezzi": 19,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 497,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 268,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 758,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 337,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 458,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 247,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 700,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 311,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 367,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 238,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 576,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 310,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 348,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 224,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 564,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 304,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 576,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 310,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "laspezia": {
    "label": "La Spezia",
    "id": 1600,
    "linea": "Base",
    "sub": "Linea Base · ID 1600",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/laspezia.json?v=1d11e937",
    "pezzi": 17,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 395,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 368,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 612,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 510,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 365,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 340,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 565,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 470,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 302,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 319,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 480,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 445,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 298,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 306,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 532,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 433,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 480,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 445,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "laguna": {
    "label": "Laguna",
    "id": 1700,
    "linea": "Base",
    "sub": "Linea Base · ID 1700",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/laguna.json?v=d689f4e4",
    "pezzi": 17,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 646,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 368,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1374,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 0,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 597,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 340,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1268,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 0,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 447,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 319,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1070,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 0,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 437,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 306,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1103,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 0,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1070,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 0,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "savona": {
    "label": "Savona",
    "id": 1900,
    "linea": "Base",
    "sub": "Linea Base · ID 1900",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/savona.json?v=f8c2ed62",
    "pezzi": 20,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 497,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 268,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 758,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 337,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 458,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 247,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 700,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 311,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 367,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 238,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 576,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 310,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 348,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 224,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 564,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 304,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 576,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 310,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "venezia": {
    "label": "Venezia",
    "id": 1500,
    "linea": "Base",
    "sub": "Linea Base · ID 1500",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/venezia.json?v=b6741c20",
    "pezzi": 25,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 395,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 368,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 612,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 510,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 365,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 340,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 565,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 470,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 302,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 319,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 480,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 445,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 298,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 306,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 532,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 433,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 480,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 445,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "america": {
    "label": "America",
    "id": 3000,
    "linea": "100",
    "sub": "Linea 100 · ID 3000",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/america.json?v=e0cdd78a",
    "pezzi": 7,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 735,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 998,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 678,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 922,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 528,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 769,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 524,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 764,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 769,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "arizona": {
    "label": "Arizona",
    "id": 3200,
    "linea": "100",
    "sub": "Linea 100 · ID 3200",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/arizona.json?v=8610237f",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 851,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1106,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 786,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1021,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 600,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 835,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 570,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 833,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 835,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "campania": {
    "label": "Campania",
    "id": 2700,
    "linea": "Base",
    "sub": "Linea Base · ID 2700",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/campania.json?v=2392ac85",
    "pezzi": 5,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 395,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 612,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 365,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 565,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 302,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 480,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 298,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 532,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 480,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "cortina": {
    "label": "Cortina",
    "id": 2200,
    "linea": "Base",
    "sub": "Linea Base · ID 2200",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/cortina.json?v=e680dc2d",
    "pezzi": 11,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 497,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 227,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 758,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 296,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 458,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 210,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 700,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 274,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 367,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 193,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 576,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 265,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 348,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 181,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 564,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 247,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 576,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 265,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "emilia": {
    "label": "Emilia",
    "id": 2900,
    "linea": "Base",
    "sub": "Linea Base · ID 2900",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/emilia.json?v=8c359557",
    "pezzi": 7,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 788,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1037,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 727,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 958,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 564,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 798,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 496,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 732,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 798,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "indiana": {
    "label": "Indiana",
    "id": 3300,
    "linea": "100",
    "sub": "Linea 100 · ID 3300",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/indiana.json?v=dd69c1f0",
    "pezzi": 11,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 915,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1187,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 845,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1096,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 667,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 910,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 628,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 901,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 910,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "nebraska": {
    "label": "Nebraska",
    "id": 3400,
    "linea": "100",
    "sub": "Linea 100 · ID 3400",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/nebraska.json?v=9aca8f07",
    "pezzi": 13,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 448,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 185,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 710,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 326,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 414,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 170,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 655,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 301,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 356,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 160,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 598,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 288,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 364,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 145,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 601,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 272,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 598,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 288,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "pluglia": {
    "label": "Pluglia",
    "id": 2300,
    "linea": "Base",
    "sub": "Linea Base · ID 2300",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/pluglia.json?v=92bf54af",
    "pezzi": 5,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1012,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1286,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 933,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1187,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 742,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1012,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 679,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 942,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1012,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "sicilia": {
    "label": "Sicilia",
    "id": 2800,
    "linea": "Base",
    "sub": "Linea Base · ID 2800",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/sicilia.json?v=13077686",
    "pezzi": 7,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 520,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 774,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 480,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 714,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 408,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 641,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 354,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 590,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 641,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "taormina": {
    "label": "Taormina",
    "id": 1300,
    "linea": "Base",
    "sub": "Linea Base · ID 1300",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/taormina.json?v=94850765",
    "pezzi": 13,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 395,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 185,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 612,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 326,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 365,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 170,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 565,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 301,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 302,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 160,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 480,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 288,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 298,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 145,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 532,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 272,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 480,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 288,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "toscana": {
    "label": "Toscana",
    "id": 2600,
    "linea": "Base",
    "sub": "Linea Base · ID 2600",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/toscana.json?v=af385ef8",
    "pezzi": 5,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 646,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 864,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 597,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 798,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 447,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 623,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 437,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 670,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 623,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "virginia": {
    "label": "Virginia",
    "id": 3100,
    "linea": "100",
    "sub": "Linea 100 · ID 3100",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/virginia.json?v=ca51313c",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 851,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1106,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 786,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1021,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 600,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 835,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 570,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 833,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 835,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "alaska": {
    "label": "Alaska",
    "id": 4400,
    "linea": "100",
    "sub": "Linea 100 · ID 4400",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/alaska.json?v=f434c1a5",
    "pezzi": 5,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 448,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 710,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 414,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 655,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 356,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 598,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 364,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 605,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 598,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "california": {
    "label": "California",
    "id": 3600,
    "linea": "100",
    "sub": "Linea 100 · ID 3600",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/california.json?v=627649de",
    "pezzi": 33,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 448,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 368,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 710,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 510,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 414,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 340,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 655,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 470,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 356,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 319,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 598,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 445,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 364,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 306,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 601,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 433,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 598,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 445,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "cambridge": {
    "label": "Cambridge",
    "id": 5800,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5800",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/cambridge.json?v=f063711c",
    "pezzi": 19,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 754,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 370,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 974,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 474,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 696,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 342,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 899,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 438,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 578,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 314,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 780,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 410,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 579,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 272,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 808,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 367,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 780,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 410,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "dublino": {
    "label": "Dublino",
    "id": 5400,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5400",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/dublino.json?v=5aa9f5e7",
    "pezzi": 7,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 754,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 974,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 696,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 899,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 578,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 780,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 579,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 808,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 780,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "florida": {
    "label": "Florida",
    "id": 3500,
    "linea": "100",
    "sub": "Linea 100 · ID 3500",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/florida.json?v=772798bc",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 448,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 185,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 710,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 326,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 414,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 170,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 655,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 301,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 356,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 160,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 598,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 288,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 364,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 145,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 601,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 272,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 598,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 288,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "georgia": {
    "label": "Georgia",
    "id": 3700,
    "linea": "100",
    "sub": "Linea 100 · ID 3700",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/georgia.json?v=ba48fc4d",
    "pezzi": 25,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 651,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 268,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 849,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 351,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 601,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 247,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 784,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 324,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 498,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 238,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 678,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 310,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 507,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 224,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 689,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 304,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 678,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 310,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "liverpool": {
    "label": "Liverpool",
    "id": 5100,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5100",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/liverpool.json?v=116df17f",
    "pezzi": 31,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 636,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 552,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 927,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 722,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 587,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 510,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 856,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 666,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 503,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 467,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 764,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 619,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 532,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 392,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 802,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 560,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 764,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 619,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "london": {
    "label": "London",
    "id": 5000,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5000",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/london.json?v=9cf8cac7",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1088,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1381,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1004,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1274,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 804,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1066,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 787,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1066,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1066,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "luisiana": {
    "label": "Luisiana",
    "id": 4100,
    "linea": "100",
    "sub": "Linea 100 · ID 4100",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/luisiana.json?v=2236eb7b",
    "pezzi": 11,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 549,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 227,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 741,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 296,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 506,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 210,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 684,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 274,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 419,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 193,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 612,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 265,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 429,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 181,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 641,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 247,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 612,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 265,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "montana": {
    "label": "Montana",
    "id": 4000,
    "linea": "100",
    "sub": "Linea 100 · ID 4000",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/montana.json?v=fef15fde",
    "pezzi": 7,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 549,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 793,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 506,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 732,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 419,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 612,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 429,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 641,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 612,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "nevada": {
    "label": "Nevada",
    "id": 4300,
    "linea": "100",
    "sub": "Linea 100 · ID 4300",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/nevada.json?v=90e161dd",
    "pezzi": 5,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 735,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 998,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 679,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 922,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 526,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 769,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 524,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 764,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 769,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "newjersey": {
    "label": "New Jersey",
    "id": 3900,
    "linea": "100",
    "sub": "Linea 100 · ID 3900",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/newjersey.json?v=30beedfa",
    "pezzi": 23,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 549,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 268,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 793,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 351,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 506,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 247,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 732,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 324,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 419,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 238,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 612,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 310,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 429,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 224,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 641,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 304,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 612,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 310,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "newyork": {
    "label": "New York",
    "id": 4200,
    "linea": "100",
    "sub": "Linea 100 · ID 4200",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/newyork.json?v=ac637de1",
    "pezzi": 17,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 549,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 227,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 741,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 296,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 506,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 210,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 684,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 274,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 419,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 193,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 612,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 265,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 429,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 181,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 641,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 247,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 612,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 265,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "oldcity": {
    "label": "Old City",
    "id": 5200,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5200",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/oldcity.json?v=d81bc2a3",
    "pezzi": 27,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 785,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 410,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 974,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 514,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 725,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 378,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 899,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 474,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 607,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 353,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 780,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 445,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 605,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 299,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 808,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 415,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 780,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 445,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "oxford": {
    "label": "Oxford",
    "id": 5300,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5300",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/oxford.json?v=0304a3d4",
    "pezzi": 25,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 785,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 410,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 974,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 514,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 725,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 378,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 899,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 474,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 607,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 353,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 780,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 445,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 605,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 299,
          "fermavetro": 10,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 808,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 415,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 780,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 445,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "philadelphia": {
    "label": "Philadelphia",
    "id": 3800,
    "linea": "100",
    "sub": "Linea 100 · ID 3800",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/philadelphia.json?v=42e8087c",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 651,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 849,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 601,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 784,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 498,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 678,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 507,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 689,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 678,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "queen": {
    "label": "Queen",
    "id": 5700,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5700",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/queen.json?v=a38ec2ff",
    "pezzi": 25,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 636,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 473,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 927,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 640,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 587,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 437,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 856,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 590,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 503,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 408,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 764,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 550,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 532,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 346,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 802,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 496,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 764,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 550,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "tamigi": {
    "label": "Tamigi",
    "id": 5500,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5500",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/tamigi.json?v=7b9af2aa",
    "pezzi": 13,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 636,
          "montanti": 220,
          "coprifili": 87,
          "grigliato": 190,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 927,
          "montanti": 238,
          "coprifili": 99,
          "grigliato": 315,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 587,
          "montanti": 203,
          "coprifili": 80,
          "grigliato": 175,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 856,
          "montanti": 220,
          "coprifili": 91,
          "grigliato": 290,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 503,
          "montanti": 124,
          "coprifili": 59,
          "grigliato": 167,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 764,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 274,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 532,
          "montanti": 115,
          "coprifili": 32,
          "grigliato": 142,
          "fermavetro": 31,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 802,
          "montanti": 144,
          "coprifili": 49,
          "grigliato": 251,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 764,
          "montanti": 142,
          "coprifili": 73,
          "grigliato": 274,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "alessandriadue": {
    "label": "ALESSANDRIA DUE",
    "id": 2500,
    "linea": "Base",
    "sub": "Linea Base · ID 2500",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/alessandriadue.json?v=56b331ae",
    "pezzi": 11,
    "ante": 2,
    "larghezze": [
      379,
      836
    ],
    "apre": [
      false,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1680,
          "montanti": 440,
          "coprifili": 174,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2226,
          "montanti": 476,
          "coprifili": 198,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1550,
          "montanti": 406,
          "coprifili": 160,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2054,
          "montanti": 440,
          "coprifili": 182,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1164,
          "montanti": 248,
          "coprifili": 118,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1708,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1246,
          "montanti": 230,
          "coprifili": 64,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1768,
          "montanti": 288,
          "coprifili": 98,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1708,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      }
    }
  },
  "alessandrialux": {
    "label": "ALESSANDRIA LUX",
    "id": 2500,
    "linea": "Base",
    "sub": "Linea Base · ID 2500",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/alessandrialux.json?v=bb97a6bd",
    "pezzi": 12,
    "ante": 2,
    "larghezze": [
      833,
      835
    ],
    "apre": [
      true,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1680,
          "montanti": 440,
          "coprifili": 174,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2226,
          "montanti": 476,
          "coprifili": 198,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1550,
          "montanti": 406,
          "coprifili": 160,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2054,
          "montanti": 440,
          "coprifili": 182,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1164,
          "montanti": 248,
          "coprifili": 118,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1708,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1246,
          "montanti": 230,
          "coprifili": 64,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1768,
          "montanti": 288,
          "coprifili": 98,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1708,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      }
    }
  },
  "americadue": {
    "label": "AMERICA DUE",
    "id": 3000,
    "linea": "100",
    "sub": "Linea 100 · ID 3000",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/americadue.json?v=037bc09b",
    "pezzi": 14,
    "ante": 2,
    "larghezze": [
      380,
      833
    ],
    "apre": [
      false,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1470,
          "montanti": 440,
          "coprifili": 174,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1996,
          "montanti": 476,
          "coprifili": 198,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1356,
          "montanti": 406,
          "coprifili": 160,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1844,
          "montanti": 440,
          "coprifili": 182,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1056,
          "montanti": 248,
          "coprifili": 118,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1538,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1048,
          "montanti": 230,
          "coprifili": 64,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1528,
          "montanti": 288,
          "coprifili": 98,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1538,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      }
    }
  },
  "bigpiccadilly": {
    "label": "BIG PICCADILLY",
    "id": 4600,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 4600",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/bigpiccadilly.json?v=5c0c5dba",
    "pezzi": 14,
    "ante": 2,
    "larghezze": [
      380,
      833
    ],
    "apre": [
      false,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1846,
          "montanti": 440,
          "coprifili": 174,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2432,
          "montanti": 476,
          "coprifili": 198,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1704,
          "montanti": 406,
          "coprifili": 160,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2244,
          "montanti": 440,
          "coprifili": 182,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1346,
          "montanti": 248,
          "coprifili": 118,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1868,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1354,
          "montanti": 230,
          "coprifili": 64,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1894,
          "montanti": 288,
          "coprifili": 98,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1868,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      }
    }
  },
  "cambridgetwo": {
    "label": "CAMBRIDGE TWO",
    "id": 5800,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5800",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/cambridgetwo.json?v=0f2076b6",
    "pezzi": 30,
    "ante": 2,
    "larghezze": [
      371,
      837
    ],
    "apre": [
      false,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1508,
          "montanti": 440,
          "coprifili": 174,
          "grigliato": 740,
          "fermavetro": 20,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1948,
          "montanti": 476,
          "coprifili": 198,
          "grigliato": 948,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1392,
          "montanti": 406,
          "coprifili": 160,
          "grigliato": 684,
          "fermavetro": 20,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1798,
          "montanti": 440,
          "coprifili": 182,
          "grigliato": 876,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1156,
          "montanti": 248,
          "coprifili": 118,
          "grigliato": 628,
          "fermavetro": 20,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1560,
          "montanti": 284,
          "coprifili": 146,
          "grigliato": 820,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1158,
          "montanti": 230,
          "coprifili": 64,
          "grigliato": 544,
          "fermavetro": 20,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1616,
          "montanti": 288,
          "coprifili": 98,
          "grigliato": 734,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1560,
          "montanti": 284,
          "coprifili": 146,
          "grigliato": 820,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "cosenza": {
    "label": "COSENZA",
    "id": null,
    "linea": "100-C",
    "sub": "Linea 100-C · senza ID",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/cosenza.json?v=67c6ae52",
    "pezzi": 9,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1044,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1265,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 964,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1168,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 810,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 983,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 794,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1037,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 983,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "kingtamigi": {
    "label": "KING TAMIGI",
    "id": 5500,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5500",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/kingtamigi.json?v=6550c111",
    "pezzi": 26,
    "ante": 2,
    "larghezze": [
      425,
      858
    ],
    "apre": [
      false,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1272,
          "montanti": 440,
          "coprifili": 174,
          "grigliato": 380,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1854,
          "montanti": 476,
          "coprifili": 198,
          "grigliato": 630,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1174,
          "montanti": 406,
          "coprifili": 160,
          "grigliato": 350,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1712,
          "montanti": 440,
          "coprifili": 182,
          "grigliato": 580,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1006,
          "montanti": 248,
          "coprifili": 118,
          "grigliato": 334,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1528,
          "montanti": 284,
          "coprifili": 146,
          "grigliato": 548,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1064,
          "montanti": 230,
          "coprifili": 64,
          "grigliato": 284,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1604,
          "montanti": 288,
          "coprifili": 98,
          "grigliato": 502,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1528,
          "montanti": 284,
          "coprifili": 146,
          "grigliato": 548,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "lagunalux": {
    "label": "LAGUNA LUX",
    "id": 1700,
    "linea": "Base",
    "sub": "Linea Base · ID 1700",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/lagunalux.json?v=c0420fce",
    "pezzi": 30,
    "ante": 2,
    "larghezze": [
      774,
      777
    ],
    "apre": [
      true,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1292,
          "montanti": 440,
          "coprifili": 174,
          "grigliato": 736,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2748,
          "montanti": 476,
          "coprifili": 198,
          "grigliato": 0,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1194,
          "montanti": 406,
          "coprifili": 160,
          "grigliato": 680,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2536,
          "montanti": 440,
          "coprifili": 182,
          "grigliato": 0,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 894,
          "montanti": 248,
          "coprifili": 118,
          "grigliato": 638,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2140,
          "montanti": 284,
          "coprifili": 146,
          "grigliato": 0,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 874,
          "montanti": 230,
          "coprifili": 64,
          "grigliato": 612,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2206,
          "montanti": 288,
          "coprifili": 98,
          "grigliato": 0,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 2140,
          "montanti": 284,
          "coprifili": 146,
          "grigliato": 0,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "liverpooltwo": {
    "label": "LIVERPOOL TWO",
    "id": 5100,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5100",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/liverpooltwo.json?v=9bc130d8",
    "pezzi": 44,
    "ante": 2,
    "larghezze": [
      379,
      837
    ],
    "apre": [
      false,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1272,
          "montanti": 440,
          "coprifili": 174,
          "grigliato": 1104,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1854,
          "montanti": 476,
          "coprifili": 198,
          "grigliato": 1444,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1174,
          "montanti": 406,
          "coprifili": 160,
          "grigliato": 1020,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1712,
          "montanti": 440,
          "coprifili": 182,
          "grigliato": 1332,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1006,
          "montanti": 248,
          "coprifili": 118,
          "grigliato": 934,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1528,
          "montanti": 284,
          "coprifili": 146,
          "grigliato": 1238,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1064,
          "montanti": 230,
          "coprifili": 64,
          "grigliato": 784,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1604,
          "montanti": 288,
          "coprifili": 98,
          "grigliato": 1120,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1528,
          "montanti": 284,
          "coprifili": 146,
          "grigliato": 1238,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "nevadadue": {
    "label": "NEVADA DUE",
    "id": 4300,
    "linea": "100",
    "sub": "Linea 100 · ID 4300",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/nevadadue.json?v=4c8fa83e",
    "pezzi": 10,
    "ante": 2,
    "larghezze": [
      380,
      833
    ],
    "apre": [
      false,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1470,
          "montanti": 440,
          "coprifili": 174,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1996,
          "montanti": 476,
          "coprifili": 198,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1358,
          "montanti": 406,
          "coprifili": 160,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1844,
          "montanti": 440,
          "coprifili": 182,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1052,
          "montanti": 248,
          "coprifili": 118,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1538,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1048,
          "montanti": 230,
          "coprifili": 64,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1528,
          "montanti": 288,
          "coprifili": 98,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1538,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      }
    }
  },
  "nevadalux": {
    "label": "NEVADA LUX",
    "id": 4300,
    "linea": "100",
    "sub": "Linea 100 · ID 4300",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/nevadalux.json?v=22b7a1fe",
    "pezzi": 10,
    "ante": 2,
    "larghezze": [
      780,
      778
    ],
    "apre": [
      true,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1470,
          "montanti": 440,
          "coprifili": 174,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1996,
          "montanti": 476,
          "coprifili": 198,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1358,
          "montanti": 406,
          "coprifili": 160,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1844,
          "montanti": 440,
          "coprifili": 182,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1052,
          "montanti": 248,
          "coprifili": 118,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1538,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1048,
          "montanti": 230,
          "coprifili": 64,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1528,
          "montanti": 288,
          "coprifili": 98,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1538,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      }
    }
  },
  "oldenglandlux": {
    "label": "OLD ENGLAND LUX",
    "id": 4500,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 4500",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/oldenglandlux.json?v=e7317f05",
    "pezzi": 10,
    "ante": 2,
    "larghezze": [
      780,
      778
    ],
    "apre": [
      true,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1846,
          "montanti": 440,
          "coprifili": 174,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2432,
          "montanti": 476,
          "coprifili": 198,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1704,
          "montanti": 406,
          "coprifili": 160,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2244,
          "montanti": 440,
          "coprifili": 182,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1346,
          "montanti": 248,
          "coprifili": 118,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1868,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1354,
          "montanti": 230,
          "coprifili": 64,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1894,
          "montanti": 288,
          "coprifili": 98,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1868,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      }
    }
  },
  "oldengland": {
    "label": "OLD ENGLAND",
    "id": 4500,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 4500",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/oldengland.json?v=4dea84d1",
    "pezzi": 10,
    "ante": 2,
    "larghezze": [
      380,
      833
    ],
    "apre": [
      false,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1846,
          "montanti": 440,
          "coprifili": 174,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2432,
          "montanti": 476,
          "coprifili": 198,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1704,
          "montanti": 406,
          "coprifili": 160,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2244,
          "montanti": 440,
          "coprifili": 182,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1346,
          "montanti": 248,
          "coprifili": 118,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1868,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1354,
          "montanti": 230,
          "coprifili": 64,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1894,
          "montanti": 288,
          "coprifili": 98,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1868,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      }
    }
  },
  "oxfordtwo": {
    "label": "OXFORD TWO",
    "id": 5300,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5300",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/oxfordtwo.json?v=ebd057ea",
    "pezzi": 36,
    "ante": 2,
    "larghezze": [
      377,
      837
    ],
    "apre": [
      false,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1570,
          "montanti": 440,
          "coprifili": 174,
          "grigliato": 820,
          "fermavetro": 20,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1948,
          "montanti": 476,
          "coprifili": 198,
          "grigliato": 1028,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1450,
          "montanti": 406,
          "coprifili": 160,
          "grigliato": 756,
          "fermavetro": 20,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1798,
          "montanti": 440,
          "coprifili": 182,
          "grigliato": 948,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1214,
          "montanti": 248,
          "coprifili": 118,
          "grigliato": 706,
          "fermavetro": 20,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1560,
          "montanti": 284,
          "coprifili": 146,
          "grigliato": 890,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1210,
          "montanti": 230,
          "coprifili": 64,
          "grigliato": 598,
          "fermavetro": 20,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1616,
          "montanti": 288,
          "coprifili": 98,
          "grigliato": 830,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1560,
          "montanti": 284,
          "coprifili": 146,
          "grigliato": 890,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "piacenzadue": {
    "label": "PIACENZA DUE",
    "id": 900,
    "linea": "Base",
    "sub": "Linea Base · ID 900",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/piacenzadue.json?v=a31220ef",
    "pezzi": 18,
    "ante": 2,
    "larghezze": [
      380,
      833
    ],
    "apre": [
      false,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1686,
          "montanti": 440,
          "coprifili": 174,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2192,
          "montanti": 476,
          "coprifili": 198,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1556,
          "montanti": 406,
          "coprifili": 160,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2024,
          "montanti": 440,
          "coprifili": 182,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1206,
          "montanti": 248,
          "coprifili": 118,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1666,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1050,
          "montanti": 230,
          "coprifili": 64,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1538,
          "montanti": 288,
          "coprifili": 98,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1666,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      }
    }
  },
  "praga": {
    "label": "PRAGA",
    "id": 6100,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 6100",
    "descIt": "Porta con vano vetro",
    "descEn": "Glazed panel door",
    "file": "assets/porte/praga.json?v=75caf730",
    "pezzi": 7,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1787,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 2051,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1650,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1894,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1560,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1802,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1560,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1800,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1802,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  },
  "queentwo": {
    "label": "QUEEN TWO",
    "id": 5700,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5700",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/queentwo.json?v=c8a18133",
    "pezzi": 38,
    "ante": 2,
    "larghezze": [
      384,
      837
    ],
    "apre": [
      false,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1272,
          "montanti": 440,
          "coprifili": 174,
          "grigliato": 946,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1854,
          "montanti": 476,
          "coprifili": 198,
          "grigliato": 1280,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1174,
          "montanti": 406,
          "coprifili": 160,
          "grigliato": 874,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1712,
          "montanti": 440,
          "coprifili": 182,
          "grigliato": 1180,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1006,
          "montanti": 248,
          "coprifili": 118,
          "grigliato": 816,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1528,
          "montanti": 284,
          "coprifili": 146,
          "grigliato": 1100,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1064,
          "montanti": 230,
          "coprifili": 64,
          "grigliato": 692,
          "fermavetro": 62,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1604,
          "montanti": 288,
          "coprifili": 98,
          "grigliato": 992,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1528,
          "montanti": 284,
          "coprifili": 146,
          "grigliato": 1100,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "sweetlondon": {
    "label": "SWEET LONDON",
    "id": 5000,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5000",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/sweetlondon.json?v=9164b786",
    "pezzi": 16,
    "ante": 2,
    "larghezze": [
      380,
      833
    ],
    "apre": [
      false,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 2176,
          "montanti": 440,
          "coprifili": 174,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2762,
          "montanti": 476,
          "coprifili": 198,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 2008,
          "montanti": 406,
          "coprifili": 160,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2548,
          "montanti": 440,
          "coprifili": 182,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1608,
          "montanti": 248,
          "coprifili": 118,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2132,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1574,
          "montanti": 230,
          "coprifili": 64,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 2132,
          "montanti": 288,
          "coprifili": 98,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 2132,
          "montanti": 284,
          "coprifili": 146,
          "serratura": 0
        }
      }
    }
  },
  "timesquaretwo": {
    "label": "TIME SQUARE TWO",
    "id": 5600,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 5600",
    "descIt": "Porta vetrata con grigliato all’inglese",
    "descEn": "Glazed door with English grille",
    "file": "assets/porte/timesquaretwo.json?v=f9c94e88",
    "pezzi": 22,
    "ante": 2,
    "larghezze": [
      379,
      836
    ],
    "apre": [
      false,
      true
    ],
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne + vano vetro superiore"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "grigliato",
        "it": "Grigliato all’inglese",
        "en": "English grille",
        "desc": "Suddivisione del vetro"
      },
      {
        "id": "fermavetro",
        "it": "Montaggio cornici fermavetro",
        "en": "Mounting beadings",
        "desc": "Posa in opera"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1508,
          "montanti": 440,
          "coprifili": 174,
          "grigliato": 258,
          "fermavetro": 20,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1948,
          "montanti": 476,
          "coprifili": 198,
          "grigliato": 370,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1392,
          "montanti": 406,
          "coprifili": 160,
          "grigliato": 238,
          "fermavetro": 20,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1798,
          "montanti": 440,
          "coprifili": 182,
          "grigliato": 340,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1156,
          "montanti": 248,
          "coprifili": 118,
          "grigliato": 218,
          "fermavetro": 20,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1560,
          "montanti": 284,
          "coprifili": 146,
          "grigliato": 314,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1158,
          "montanti": 230,
          "coprifili": 64,
          "grigliato": 196,
          "fermavetro": 20,
          "serratura": 40
        },
        "verniciata": {
          "pannello": 1616,
          "montanti": 288,
          "coprifili": 98,
          "grigliato": 284,
          "fermavetro": 0,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1560,
          "montanti": 284,
          "coprifili": 146,
          "grigliato": 314,
          "fermavetro": 0,
          "serratura": 0
        }
      }
    }
  },
  "vienna": {
    "label": "VIENNA",
    "id": 6000,
    "linea": "100-C",
    "sub": "Linea 100-C · ID 6000",
    "descIt": "Porta classica con bugne",
    "descEn": "Classic panelled door",
    "file": "assets/porte/vienna.json?v=aad49ab8",
    "pezzi": 7,
    "componenti": [
      {
        "id": "pannello",
        "it": "Pannello porta",
        "en": "Door panel",
        "desc": "Montanti + bugne"
      },
      {
        "id": "montanti",
        "it": "Montanti per telaio",
        "en": "Jambs for frame",
        "desc": "Spessore mm 44"
      },
      {
        "id": "coprifili",
        "it": "Coprifili",
        "en": "Architraves",
        "desc": "Set completo per lato"
      },
      {
        "id": "serratura",
        "it": "Anube e serratura",
        "en": "Hinge and lock",
        "desc": "Finitura configurabile"
      }
    ],
    "listino": {
      "rovere": {
        "grezza": {
          "pannello": 1964,
          "montanti": 220,
          "coprifili": 87,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 2228,
          "montanti": 238,
          "coprifili": 99,
          "serratura": 0
        }
      },
      "castagno": {
        "grezza": {
          "pannello": 1813,
          "montanti": 203,
          "coprifili": 80,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 2057,
          "montanti": 220,
          "coprifili": 91,
          "serratura": 0
        }
      },
      "toulipier": {
        "grezza": {
          "pannello": 1663,
          "montanti": 124,
          "coprifili": 59,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1904,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      },
      "pino": {
        "grezza": {
          "pannello": 1658,
          "montanti": 115,
          "coprifili": 32,
          "serratura": 20
        },
        "verniciata": {
          "pannello": 1900,
          "montanti": 144,
          "coprifili": 49,
          "serratura": 0
        }
      },
      "laccato": {
        "verniciata": {
          "pannello": 1904,
          "montanti": 142,
          "coprifili": 73,
          "serratura": 0
        }
      }
    }
  }
};
