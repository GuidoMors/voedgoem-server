// Dutch Plenet questions and explanations, grouped by ISO 3166-1 alpha-3 country code.
export interface PlenetQuestion {
  question: string;
  answer: string;
  explanation: string;
}

interface CountryQuestions {
  name: string;
  questions: PlenetQuestion[];
}

export const QUESTIONS: Record<string, CountryQuestions> = {
  NLD: {
    name: "Nederland",
    questions: [
      {
        question: "Welke taal is naast het Nederlands de officiële taal in de provincie Friesland?",
        answer: "Het Fries",
        explanation: "Het antwoord is Het Fries; aanvullende uitleg: Frysk."
      },
      {
        question: "Klopt het dat het bekende draaiorgel ’de Deuntjeskast’ in Spanje is bedacht?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: Nederlandse orgelcultuur."
      },
      {
        question: "Welk warm zoet gebakken graanproduct met siroop ertussen eet je op de markt?",
        answer: "De stroopwafel",
        explanation: "Het antwoord is De stroopwafel; dit beantwoordt de vraag: Welk warm zoet gebakken graanproduct met siroop ertussen eet je op de markt?"
      },
      {
        question: "Op welke datum vieren we jaarlijks Koningsdag?",
        answer: "27 april",
        explanation: "Het antwoord is 27 april; dit beantwoordt de vraag: Op welke datum vieren we jaarlijks Koningsdag?"
      },
      {
        question: "Klopt het dat de Vaalserberg hoger is dan 1.000 meter?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: slechts 322,5 meter."
      },
      {
        question: "Klopt het dat een groot deel van Nederland onder de zeespiegel ligt?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: ongeveer een kwart van het land."
      }
    ]
  },
  BEL: {
    name: "België",
    questions: [
      {
        question: "Hoeveel officiële landstalen kent België?",
        answer: "3 talen",
        explanation: "Het antwoord is 3 talen; aanvullende uitleg: Nederlands, Frans, Duits."
      },
      {
        question: "Klopt het dat het wereldberoemde elektronische festival Tomorrowland in Brussel plaatsvindt?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: in het plaatsje Boom."
      },
      {
        question: "Klopt het dat Belgische frieten traditioneel dubbel gebakken worden in rundvet?",
        answer: "Waar",
        explanation: "De bewering is waar: Belgische frieten traditioneel dubbel gebakken worden in rundvet."
      },
      {
        question: "Welk bekende stripfiguur met een kuif en zijn hondje Bobbie komt uit België?",
        answer: "Kuifje",
        explanation: "Het antwoord is Kuifje; dit beantwoordt de vraag: Welk bekende stripfiguur met een kuif en zijn hondje Bobbie komt uit België?"
      },
      {
        question: "Klopt het dat België een eigen kustlijn aan de Middellandse Zee heeft?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: aan de Noordzee."
      },
      {
        question: "Klopt het dat Brussel zowel de hoofdstad van België als de zetel van de EU is?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: de belangrijkste EU-instellingen zitten er."
      }
    ]
  },
  DEU: {
    name: "Duitsland",
    questions: [
      {
        question: "Klopt het dat Duits de taal is met de meeste moedertaalsprekers in de Europese Unie?",
        answer: "Waar",
        explanation: "De bewering is waar: Duits de taal is met de meeste moedertaalsprekers in de Europese Unie."
      },
      {
        question: "Welke beroemde klassieke componist van de 9e symfonie werd geboren in Bonn?",
        answer: "Ludwig van Beethoven",
        explanation: "Het antwoord is Ludwig van Beethoven; dit beantwoordt de vraag: Welke beroemde klassieke componist van de 9e symfonie werd geboren in Bonn?"
      },
      {
        question: "Klopt het dat de currywurst een typisch Duits gerecht is?",
        answer: "Waar",
        explanation: "De bewering is waar: de currywurst een typisch Duits gerecht is."
      },
      {
        question: "Klopt het dat het Oktoberfest in de hoofdstad Berlijn plaatsvindt?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: in München, Beieren."
      },
      {
        question: "Klopt het dat Duitsland direct aan meer dan 10 buurlanden grenst?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: aan 9 buurlanden."
      },
      {
        question: "Wat is de hoofdstad van Duitsland?",
        answer: "Berlijn",
        explanation: "Het antwoord is Berlijn; dit beantwoordt de vraag: Wat is de hoofdstad van Duitsland?"
      }
    ]
  },
  FRA: {
    name: "Frankrijk",
    questions: [
      {
        question: "Klopt het dat er in de regio Bretagne een Keltische taal (Bretons) wordt gesproken?",
        answer: "Waar",
        explanation: "De bewering is waar: er in de regio Bretagne een Keltische taal (Bretons) wordt gesproken."
      },
      {
        question: "Welk melancholisch zanggenre met accordeon hoor je veel op de straat in Parijs?",
        answer: "Het Franse Chanson",
        explanation: "Het antwoord is Het Franse Chanson; dit beantwoordt de vraag: Welk melancholisch zanggenre met accordeon hoor je veel op de straat in Parijs?"
      },
      {
        question: "Klopt het dat men in Frankrijk bij het ontbijt traditioneel pikante taco’s eet?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: croissants en stokbrood."
      },
      {
        question: "Op welke datum valt de Franse nationale feestdag (Quatorze Juillet)?",
        answer: "14 juli",
        explanation: "Het antwoord is 14 juli; dit beantwoordt de vraag: Op welke datum valt de Franse nationale feestdag (Quatorze Juillet)?"
      },
      {
        question: "Klopt het dat de hoogste berg van West-Europa (de Mont Blanc) in Frankrijk ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: de hoogste berg van West-Europa (de Mont Blanc) in Frankrijk ligt."
      },
      {
        question: "Klopt het dat de Eiffeltoren in het jaar 1500 is gebouwd?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: in 1889 voor de Wereldtentoonstelling."
      }
    ]
  },
  ESP: {
    name: "Spanje",
    questions: [
      {
        question: "Klopt het dat er in het noorden van Spanje de unieke taal Baskisch wordt gesproken?",
        answer: "Waar",
        explanation: "De bewering is waar: er in het noorden van Spanje de unieke taal Baskisch wordt gesproken."
      },
      {
        question: "Welke gepassioneerde dans en muziekstijl met gitaar en klappen komt uit Andalusië?",
        answer: "Flamenco",
        explanation: "Het antwoord is Flamenco; dit beantwoordt de vraag: Welke gepassioneerde dans en muziekstijl met gitaar en klappen komt uit Andalusië?"
      },
      {
        question: "Klopt het dat de Spaanse rijstschotel paella van oorsprong een toetje met ijs is?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: een hartig hoofdgerecht."
      },
      {
        question: "Tijdens welk feest in Buñol gooien duizenden mensen met tomaten naar elkaar?",
        answer: "La Tomatina",
        explanation: "Het antwoord is La Tomatina; dit beantwoordt de vraag: Tijdens welk feest in Buñol gooien duizenden mensen met tomaten naar elkaar?"
      },
      {
        question: "Klopt het dat de zon in Spanje gemiddeld veel minder schijnt dan in Nederland?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: veel meer zonuren."
      },
      {
        question: "Klopt het dat Spanje in het westen direct aan Portugal grenst?",
        answer: "Waar",
        explanation: "De bewering is waar: Spanje in het westen direct aan Portugal grenst."
      }
    ]
  },
  ITA: {
    name: "Italië",
    questions: [
      {
        question: "Klopt het dat de Italiaanse taal het Cyrillische alfabet gebruikt?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: het Latijnse alfabet."
      },
      {
        question: "In welke beroemde stad staat het historische operahuis La Scala?",
        answer: "Milaan",
        explanation: "Het antwoord is Milaan; dit beantwoordt de vraag: In welke beroemde stad staat het historische operahuis La Scala?"
      },
      {
        question: "Wat betekent de term ’al dente’ bij het koken van Italiaanse pasta?",
        answer: "Beetgaar",
        explanation: "Het antwoord is Beetgaar; aanvullende uitleg: nog stevig van binnen."
      },
      {
        question: "Klopt het dat mensen prachtige maskers dragen tijdens het Carnaval van Venetië?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen prachtige maskers dragen tijdens het Carnaval van Venetië."
      },
      {
        question: "Klopt het dat Italië er op de landkaart uitziet als een vierkant?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: het heeft de vorm van een laars."
      },
      {
        question: "Welke actieve vulkaan op Sicilië is de hoogste van Europa?",
        answer: "De Etna",
        explanation: "Het antwoord is De Etna; dit beantwoordt de vraag: Welke actieve vulkaan op Sicilië is de hoogste van Europa?"
      }
    ]
  },
  GRC: {
    name: "Griekenland",
    questions: [
      {
        question: "Klopt het dat het Grieks een geheel eigen, uniek alfabet gebruikt?",
        answer: "Waar",
        explanation: "De bewering is waar: het Grieks een geheel eigen, uniek alfabet gebruikt."
      },
      {
        question: "Klopt het dat de bouzouki een bekend Grieks snaarinstrument is?",
        answer: "Waar",
        explanation: "De bewering is waar: de bouzouki een bekend Grieks snaarinstrument is."
      },
      {
        question: "Klopt het dat echte, authentieke fetakaas van koemelk wordt gemaakt?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: van schapen- en geitenmelk."
      },
      {
        question: "In welke plaats werden in de oudheid de allereerste Olympische Spelen gehouden?",
        answer: "Olympia",
        explanation: "Het antwoord is Olympia; dit beantwoordt de vraag: In welke plaats werden in de oudheid de allereerste Olympische Spelen gehouden?"
      },
      {
        question: "Klopt het dat het Griekse landschap uitsluitend uit bevroren gletsjers bestaat?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: het land heeft eilanden en een mediterraan klimaat."
      },
      {
        question: "Klopt het dat Griekenland uit meer dan 1.000 eilanden bestaat?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: er zijn er duizenden."
      }
    ]
  },
  GBR: {
    name: "Verenigd Koninkrijk",
    questions: [
      {
        question: "Klopt het dat het Welshe alfabet exact hetzelfde is als het Engelse alfabet?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: het kent eigen letters zoals Ch, Dd, Ff, Ll."
      },
      {
        question: "Welk traditioneel Schots instrument blaas je op via een zak onder je arm?",
        answer: "De doedelzak",
        explanation: "Het antwoord is De doedelzak; dit beantwoordt de vraag: Welk traditioneel Schots instrument blaas je op via een zak onder je arm?"
      },
      {
        question: "Klopt het dat ’fish and chips’ een traditioneel Brits gerecht van gefrituurde vis met patat is?",
        answer: "Waar",
        explanation: "De bewering is waar: ’fish and chips’ een traditioneel Brits gerecht van gefrituurde vis met patat is."
      },
      {
        question: "Hoe heet de Britse gewoonte om rond 16:00 uur thee met gebak te nuttigen?",
        answer: "Afternoon Tea",
        explanation: "Het antwoord is Afternoon Tea; dit beantwoordt de vraag: Hoe heet de Britse gewoonte om rond 16:00 uur thee met gebak te nuttigen?"
      },
      {
        question: "In welk land, Engeland of Schotland, leeft volgens de verhalen een monster in een meer?",
        answer: "Schotland",
        explanation: "Het antwoord is Schotland; aanvullende uitleg: Loch Ness."
      },
      {
        question: "Is Big Ben de naam van de hele toren of alleen van de grote luidklok erin?",
        answer: "Alleen de grote luidklok",
        explanation: "Het antwoord is Alleen de grote luidklok; dit beantwoordt de vraag: Is Big Ben de naam van de hele toren of alleen van de grote luidklok erin?"
      }
    ]
  },
  IRL: {
    name: "Ierland",
    questions: [
      {
        question: "Klopt het dat het Iers-Gaelisch de enige taal is die in Ierland gesproken mag worden?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: Engels is ook een officiële taal."
      },
      {
        question: "Welk klein metalen fluitje hoor je veel in Ierse pubs?",
        answer: "De Tin Whistle",
        explanation: "Het antwoord is De Tin Whistle; dit beantwoordt de vraag: Welk klein metalen fluitje hoor je veel in Ierse pubs?"
      },
      {
        question: "Klopt het dat Guinness een lichtblond, helder pilsbier is?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: een donkerzwart stout-bier."
      },
      {
        question: "Op welke feestdag op 17 maart kleurt heel Ierland groen?",
        answer: "St. Patrick’s Day",
        explanation: "Het antwoord is St. Patrick’s Day; dit beantwoordt de vraag: Op welke feestdag op 17 maart kleurt heel Ierland groen?"
      },
      {
        question: "Klopt het dat de indrukwekkende, groene Cliffs of Moher aan de westkust van Ierland liggen?",
        answer: "Waar",
        explanation: "De bewering is waar: de indrukwekkende, groene Cliffs of Moher aan de westkust van Ierland liggen."
      },
      {
        question: "Klopt het dat de Republiek Ierland hetzelfde land is als Noord-Ierland?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: Noord-Ierland hoort bij het VK."
      }
    ]
  },
  ISL: {
    name: "IJsland",
    questions: [
      {
        question: "Klopt het dat de IJslandse taal door het isolement bijna onveranderd is gebleven sinds de Vikingtijd?",
        answer: "Waar",
        explanation: "De bewering is waar: de IJslandse taal door het isolement bijna onveranderd is gebleven sinds de Vikingtijd."
      },
      {
        question: "Klopt het dat de wereldberoemde zangeres Björk uit IJsland komt?",
        answer: "Waar",
        explanation: "De bewering is waar: de wereldberoemde zangeres Björk uit IJsland komt."
      },
      {
        question: "Wat is ’Skyr’ voor een soort voedingsmiddel?",
        answer: "Traditionele IJslandse magere kwark/yoghurt",
        explanation: "Het antwoord is Traditionele IJslandse magere kwark/yoghurt; dit beantwoordt de vraag: Wat is ’Skyr’ voor een soort voedingsmiddel?"
      },
      {
        question: "Klopt het dat inwoners van IJsland dagelijks in houten klompen rondlopen?",
        answer: "Niet waar",
        explanation: "De bewering is niet waar: inwoners van IJsland dagelijks in houten klompen rondlopen."
      },
      {
        question: "Hoe heet een natuurlijke heetwaterbron die krachtig stoom en kokend water omhoog spuit?",
        answer: "Een geiser",
        explanation: "Het antwoord is Een geiser; dit beantwoordt de vraag: Hoe heet een natuurlijke heetwaterbron die krachtig stoom en kokend water omhoog spuit?"
      },
      {
        question: "Klopt het dat de zon in IJsland in de midzomer de volle 24 uur per dag schijnt?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: de middernachtzon."
      }
    ]
  },
  PRT: {
    name: "Portugal",
    questions: [
      {
        question: "Klopt het dat Portugees alleen in Portugal wordt gesproken en nergens anders?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: ook in o.a. Brazilië en Angola."
      },
      {
        question: "Hoe heet het melancholische Portugese levenslied begeleid door gitaar?",
        answer: "Fado",
        explanation: "Het antwoord is Fado; dit beantwoordt de vraag: Hoe heet het melancholische Portugese levenslied begeleid door gitaar?"
      },
      {
        question: "Klopt het dat ’pastéis de nata’ knapperige taartjes zijn, gevuld met gele custardcrème?",
        answer: "Waar",
        explanation: "De bewering is waar: ’pastéis de nata’ knapperige taartjes zijn, gevuld met gele custardcrème."
      },
      {
        question: "Klopt het dat men in juni tijdens straatfeesten traditioneel gegrilde sardientjes eet?",
        answer: "Waar",
        explanation: "De bewering is waar: men in juni tijdens straatfeesten traditioneel gegrilde sardientjes eet."
      },
      {
        question: "Van welke boom haalt men het materiaal kurk, waarvan Portugal de grootste producent is?",
        answer: "De kurkeik",
        explanation: "Het antwoord is De kurkeik; dit beantwoordt de vraag: Van welke boom haalt men het materiaal kurk, waarvan Portugal de grootste producent is?"
      },
      {
        question: "Klopt het dat Portugal aan de oostkust van het Europese continent ligt?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: aan de uiterste westkust."
      }
    ]
  },
  SWE: {
    name: "Zweden",
    questions: [
      {
        question: "Klopt het dat men in het buurland Finland ook Zweeds spreekt?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: als officiële tweede taal."
      },
      {
        question: "Welke Zweedse popgroep won het Songfestival in 1974 met het nummer ’Waterloo’?",
        answer: "ABBA",
        explanation: "Het antwoord is ABBA; dit beantwoordt de vraag: Welke Zweedse popgroep won het Songfestival in 1974 met het nummer ’Waterloo’?"
      },
      {
        question: "Klopt het dat Zweedse gehaktballetjes (köttbullar) van vis worden gemaakt?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: van gehakt/vlees."
      },
      {
        question: "Wat betekent het Zweedse woord ’Fika’?",
        answer: "Koffiedrinken met iets zoets erbij",
        explanation: "Het antwoord is Koffiedrinken met iets zoets erbij; dit beantwoordt de vraag: Wat betekent het Zweedse woord ’Fika’?"
      },
      {
        question: "Welke grote hertensoort met een reusachtig gewei leeft in de Zweedse bossen?",
        answer: "De eland",
        explanation: "Het antwoord is De eland; dit beantwoordt de vraag: Welke grote hertensoort met een reusachtig gewei leeft in de Zweedse bossen?"
      },
      {
        question: "Klopt het dat Zweden een republiek met een president is?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: een koninkrijk met een koning."
      }
    ]
  },
  NOR: {
    name: "Noorwegen",
    questions: [
      {
        question: "Klopt het dat het Noors twee officiële geschreven taalvarianten heeft (bokmål en nynorsk)?",
        answer: "Waar",
        explanation: "De bewering is waar: het Noors twee officiële geschreven taalvarianten heeft (bokmål en nynorsk)."
      },
      {
        question: "Klopt het dat men in Noorwegen de Hardangerviool bespeelt, een viool met extra meeklinkende snaren?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Noorwegen de Hardangerviool bespeelt, een viool met extra meeklinkende snaren."
      },
      {
        question: "Wat voor kleur heeft de bekende traditionele Noorse kaas Brunost?",
        answer: "Bruin",
        explanation: "Het antwoord is Bruin; aanvullende uitleg: lichtzoete smaak."
      },
      {
        question: "Klopt het dat Noren op hun nationale feestdag, 17 mei, hun traditionele dracht (bunad) dragen?",
        answer: "Waar",
        explanation: "De bewering is waar: Noren op hun nationale feestdag, 17 mei, hun traditionele dracht (bunad) dragen."
      },
      {
        question: "Klopt het dat fjorden steile inhammen zijn die door vulkaanuitbarstingen zijn ontstaan?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: ze zijn ontstaan door gletsjers."
      },
      {
        question: "Klopt het dat de Noordkaap, een beroemd noordelijk punt van Europa, in Noorwegen ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: de Noordkaap, een beroemd noordelijk punt van Europa, in Noorwegen ligt."
      }
    ]
  },
  FIN: {
    name: "Finland",
    questions: [
      {
        question: "Klopt het dat de Finse taal heel erg lijkt op het Zweeds en het Noors?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: behoort tot een heel andere taalfamilie."
      },
      {
        question: "Klopt het dat Finland bekend staat om het hoogste aantal heavymetalbands per inwoner?",
        answer: "Waar",
        explanation: "De bewering is waar: Finland bekend staat om het hoogste aantal heavymetalbands per inwoner."
      },
      {
        question: "Klopt het dat bijna elk Fins huishouden een traditionele houten sauna heeft?",
        answer: "Waar",
        explanation: "De bewering is waar: bijna elk Fins huishouden een traditionele houten sauna heeft."
      },
      {
        question: "Klopt het dat de vriendelijke witte Moemins volgens het verhaal in Finland wonen?",
        answer: "Waar",
        explanation: "De bewering is waar: de vriendelijke witte Moemins volgens het verhaal in Finland wonen."
      },
      {
        question: "Klopt het dat er in Finland meer dan 100.000 meren liggen?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: het Land van de Duizend Meren."
      },
      {
        question: "Klopt het dat Finland in het westen aan Rusland grenst?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: in het oosten grenst het aan Rusland."
      }
    ]
  },
  CHE: {
    name: "Zwitserland",
    questions: [
      {
        question: "Hoeveel officiële talen kent Zwitserland (1, 2, 3 of 4)?",
        answer: "4 talen",
        explanation: "Het antwoord is 4 talen; aanvullende uitleg: Duits, Frans, Italiaans, Reto-Romaans."
      },
      {
        question: "Welk meterslang houten blaasinstrument werd vroeger door alpenherders gebruikt?",
        answer: "De alpenhoorn",
        explanation: "Het antwoord is De alpenhoorn; dit beantwoordt de vraag: Welk meterslang houten blaasinstrument werd vroeger door alpenherders gebruikt?"
      },
      {
        question: "Klopt het dat men bij Zwitserse kaasfondue vis en frietjes in olie dopt?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: men doopt stukjes brood in gesmolten kaas."
      },
      {
        question: "Klopt het dat het Zwitserse zakmes rood is met een wit kruis erop?",
        answer: "Waar",
        explanation: "De bewering is waar: het Zwitserse zakmes rood is met een wit kruis erop."
      },
      {
        question: "Welke bekende piramidevormige berg staat op de Toblerone-verpakking?",
        answer: "De Matterhorn",
        explanation: "Het antwoord is De Matterhorn; dit beantwoordt de vraag: Welke bekende piramidevormige berg staat op de Toblerone-verpakking?"
      },
      {
        question: "Klopt het dat Zwitserland lid is van de Europese Unie?",
        answer: "Niet waar",
        explanation: "De bewering is niet waar: Zwitserland lid is van de Europese Unie."
      }
    ]
  },
  AUT: {
    name: "Oostenrijk",
    questions: [
      {
        question: "Klopt het dat men in Oostenrijk Oostenrijks spreekt als officiële eigen taal?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: Duits is de officiële taal."
      },
      {
        question: "Hoe noemt men de bijzondere zangtechniek uit de bergen waarbij de stem snel verspringt?",
        answer: "Jodelen",
        explanation: "Het antwoord is Jodelen; dit beantwoordt de vraag: Hoe noemt men de bijzondere zangtechniek uit de bergen waarbij de stem snel verspringt?"
      },
      {
        question: "Klopt het dat een echte, traditionele Wiener schnitzel van kipfilet wordt gemaakt?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: officieel van kalfsvlees."
      },
      {
        question: "Klopt het dat alpineskiën de populairste wintersport van het land is?",
        answer: "Waar",
        explanation: "De bewering is waar: alpineskiën de populairste wintersport van het land is."
      },
      {
        question: "Welk beschermd, klein, wit alpenbloempje is het symbool van het land?",
        answer: "Het edelweiss",
        explanation: "Het antwoord is Het edelweiss; dit beantwoordt de vraag: Welk beschermd, klein, wit alpenbloempje is het symbool van het land?"
      },
      {
        question: "Wat is de muzikale hoofdstad van Oostenrijk waar Mozart en Beethoven werkten?",
        answer: "Wenen",
        explanation: "Het antwoord is Wenen; dit beantwoordt de vraag: Wat is de muzikale hoofdstad van Oostenrijk waar Mozart en Beethoven werkten?"
      }
    ]
  },
  POL: {
    name: "Polen",
    questions: [
      {
        question: "Klopt het dat de Poolse taal in het Cyrillische schrift wordt geschreven?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: in het Latijnse alfabet."
      },
      {
        question: "Klopt het dat de polonaise een snelle reidans is die uit Polen afkomstig is?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: het is een statige, langzame dans."
      },
      {
        question: "Hoe heten de bekende Poolse gevulde deegkussentjes?",
        answer: "Pierogi",
        explanation: "Het antwoord is Pierogi; dit beantwoordt de vraag: Hoe heten de bekende Poolse gevulde deegkussentjes?"
      },
      {
        question: "Klopt het dat jongeren op ’Natte Maandag’ na Pasen water over elkaar heen gooien?",
        answer: "Waar",
        explanation: "De bewering is waar: jongeren op ’Natte Maandag’ na Pasen water over elkaar heen gooien."
      },
      {
        question: "Klopt het dat het grootste landzoogdier van Europa (de Europese bizon) in de Poolse bossen leeft?",
        answer: "Waar",
        explanation: "De bewering is waar: het grootste landzoogdier van Europa (de Europese bizon) in de Poolse bossen leeft."
      },
      {
        question: "Wat is de hoofdstad van Polen?",
        answer: "Warschau",
        explanation: "Het antwoord is Warschau; dit beantwoordt de vraag: Wat is de hoofdstad van Polen?"
      }
    ]
  },
  HUN: {
    name: "Hongarije",
    questions: [
      {
        question: "Klopt het dat de Hongaarse taal tot dezelfde taalfamilie behoort als het Duits en het Engels?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: tot de Fins-Oegrische taalfamilie."
      },
      {
        question: "Welk strijkinstrument hoor je veel in traditionele Hongaarse Romamuziek?",
        answer: "De viool",
        explanation: "Het antwoord is De viool; dit beantwoordt de vraag: Welk strijkinstrument hoor je veel in traditionele Hongaarse Romamuziek?"
      },
      {
        question: "Welk rood specerijpoeder geeft de Hongaarse goulash haar smaak en kleur?",
        answer: "Paprikapoeder",
        explanation: "Het antwoord is Paprikapoeder; dit beantwoordt de vraag: Welk rood specerijpoeder geeft de Hongaarse goulash haar smaak en kleur?"
      },
      {
        question: "Klopt het dat Hongaren op doordeweekse dagen verplicht klederdracht naar hun werk dragen?",
        answer: "Niet waar",
        explanation: "De bewering is niet waar: Hongaren op doordeweekse dagen verplicht klederdracht naar hun werk dragen."
      },
      {
        question: "Klopt het dat het Balatonmeer een zoutwaterzee is?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: het is het grootste zoetwatermeer van Midden-Europa."
      },
      {
        question: "Welke grote rivier stroomt dwars door de hoofdstad Boedapest?",
        answer: "De Donau",
        explanation: "Het antwoord is De Donau; dit beantwoordt de vraag: Welke grote rivier stroomt dwars door de hoofdstad Boedapest?"
      }
    ]
  },
  CZE: {
    name: "Tsjechië",
    questions: [
      {
        question: "Klopt het dat er in Tsjechië Tsjechisch wordt gesproken?",
        answer: "Waar",
        explanation: "De bewering is waar: er in Tsjechië Tsjechisch wordt gesproken."
      },
      {
        question: "Klopt het dat de beroemde klassieke componist Antonín Dvořák uit Tsjechië komt?",
        answer: "Waar",
        explanation: "De bewering is waar: de beroemde klassieke componist Antonín Dvořák uit Tsjechië komt."
      },
      {
        question: "Klopt het dat er in Tsjechië per persoon gemiddeld het meeste bier ter wereld wordt gedronken?",
        answer: "Waar",
        explanation: "De bewering is waar: er in Tsjechië per persoon gemiddeld het meeste bier ter wereld wordt gedronken."
      },
      {
        question: "Klopt het dat de biersoort ’pils’ naar een Tsjechische stad is vernoemd?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: de stad Pilsen."
      },
      {
        question: "Klopt het dat Tsjechië een uitgestrekte kust aan de Atlantische Oceaan heeft?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: ingesloten land."
      },
      {
        question: "Wat is de sprookjesachtige hoofdstad van Tsjechië?",
        answer: "Praag",
        explanation: "Het antwoord is Praag; dit beantwoordt de vraag: Wat is de sprookjesachtige hoofdstad van Tsjechië?"
      }
    ]
  },
  ROU: {
    name: "Roemenië",
    questions: [
      {
        question: "Klopt het dat de Roemeense taal een Germaanse taal is, zoals het Duits?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: een Romaanse taal, afstammend van Latijn."
      },
      {
        question: "Klopt het dat Roemeense straatorkesten vaak meeslepende viool- en accordeonmuziek spelen?",
        answer: "Waar",
        explanation: "De bewering is waar: Roemeense straatorkesten vaak meeslepende viool- en accordeonmuziek spelen."
      },
      {
        question: "Hoe heten de traditionele Roemeense koolrolletjes gevuld met gehakt?",
        answer: "Sarmale",
        explanation: "Het antwoord is Sarmale; dit beantwoordt de vraag: Hoe heten de traditionele Roemeense koolrolletjes gevuld met gehakt?"
      },
      {
        question: "Klopt het dat mensen elkaar op 1 maart kleine rood-witte gelukskoordjes (mărțișor) geven?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen elkaar op 1 maart kleine rood-witte gelukskoordjes (mărțișor) geven."
      },
      {
        question: "Klopt het dat er in de Roemeense Karpaten nog veel wilde bruine beren voorkomen?",
        answer: "Waar",
        explanation: "De bewering is waar: er in de Roemeense Karpaten nog veel wilde bruine beren voorkomen."
      },
      {
        question: "Welke mythische vampier wordt in verband gebracht met kasteel Bran?",
        answer: "Graaf Dracula",
        explanation: "Het antwoord is Graaf Dracula; dit beantwoordt de vraag: Welke mythische vampier wordt in verband gebracht met kasteel Bran?"
      }
    ]
  },
  UKR: {
    name: "Oekraïne",
    questions: [
      {
        question: "Klopt het dat de Oekraïense taal het Latijnse alfabet gebruikt?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: het Cyrillische alfabet."
      },
      {
        question: "Wat voor instrument is de Oekraïense bandura?",
        answer: "Een traditioneel tokkelinstrument",
        explanation: "Het antwoord is Een traditioneel tokkelinstrument; dit beantwoordt de vraag: Wat voor instrument is de Oekraïense bandura?"
      },
      {
        question: "Welke bekende rode bietensoep met zure room is het nationale gerecht?",
        answer: "Borscht",
        explanation: "Het antwoord is Borscht; aanvullende uitleg: Borstsj."
      },
      {
        question: "Klopt het dat families voor Pasen prachtige patronen op eieren schilderen (pysanka)?",
        answer: "Waar",
        explanation: "De bewering is waar: families voor Pasen prachtige patronen op eieren schilderen (pysanka)."
      },
      {
        question: "Klopt het dat gele zonnebloemen in de zomer de uitgestrekte akkers sieren?",
        answer: "Waar",
        explanation: "De bewering is waar: gele zonnebloemen in de zomer de uitgestrekte akkers sieren."
      },
      {
        question: "Klopt het dat Oekraïne qua landoppervlakte het kleinste land van Europa is?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: het is juist het grootste land dat geheel in Europa ligt."
      }
    ]
  },
  HRV: {
    name: "Kroatië",
    questions: [
      {
        question: "Klopt het dat men in Kroatië nog steeds met de oude munt, de kuna, betaalt?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: sinds 2023 betaalt men met de Euro."
      },
      {
        question: "Zingen Kroatische klapagroepen traditioneel meerstemmig met instrumenten of a cappella?",
        answer: "A cappella",
        explanation: "Het antwoord is A cappella; aanvullende uitleg: zonder instrumenten."
      },
      {
        question: "Klopt het dat de zwarte risotto (crni rižot) wordt gekleurd met inkt van een inktvis?",
        answer: "Waar",
        explanation: "De bewering is waar: de zwarte risotto (crni rižot) wordt gekleurd met inkt van een inktvis."
      },
      {
        question: "Welk bekend kledingstuk voor mannen komt oorspronkelijk van Kroatische soldaten?",
        answer: "De stropdas",
        explanation: "Het antwoord is De stropdas; dit beantwoordt de vraag: Welk bekend kledingstuk voor mannen komt oorspronkelijk van Kroatische soldaten?"
      },
      {
        question: "Klopt het dat de Plitvicemeren bekend staan om hun woestijnzandduinen?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: om hun meren en watervallen."
      },
      {
        question: "Klopt het dat Kroatië aan de Adriatische Zee ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Kroatië aan de Adriatische Zee ligt."
      }
    ]
  },
  DNK: {
    name: "Denemarken",
    questions: [
      {
        question: "Klopt het dat de Denen een Scandinavische taal spreken?",
        answer: "Waar",
        explanation: "De bewering is waar: de Denen een Scandinavische taal spreken."
      },
      {
        question: "Klopt het dat de Deense band Aqua het bekende nummer ’Barbie Girl’ zong?",
        answer: "Waar",
        explanation: "De bewering is waar: de Deense band Aqua het bekende nummer ’Barbie Girl’ zong."
      },
      {
        question: "Wat voor gerecht is ’smørrebrød’?",
        answer: "Traditioneel Deens belegd roggebrood",
        explanation: "Het antwoord is Traditioneel Deens belegd roggebrood; dit beantwoordt de vraag: Wat voor gerecht is ’smørrebrød’?"
      },
      {
        question: "Welk Deens woord beschrijft het gevoel van knusse gezelligheid?",
        answer: "Hygge",
        explanation: "Het antwoord is Hygge; dit beantwoordt de vraag: Welk Deens woord beschrijft het gevoel van knusse gezelligheid?"
      },
      {
        question: "Klopt het dat de Deense schrijver Andersen het sprookje ’De kleine zeemeermin’ schreef?",
        answer: "Waar",
        explanation: "De bewering is waar: de Deense schrijver Andersen het sprookje ’De kleine zeemeermin’ schreef."
      },
      {
        question: "Klopt het dat het bekende speelgoed met de gekleurde plastic steentjes (LEGO) uit Denemarken komt?",
        answer: "Waar",
        explanation: "De bewering is waar: het bekende speelgoed met de gekleurde plastic steentjes (LEGO) uit Denemarken komt."
      }
    ]
  },
  ALB: {
    name: "Albanië",
    questions: [
      {
        question: "Klopt het dat het Albanees verwant is aan het Nederlands?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: een unieke eigen tak binnen de taalfamilie."
      },
      {
        question: "Klopt het dat men in Albanië van meerstemmige volkszang houdt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Albanië van meerstemmige volkszang houdt."
      },
      {
        question: "Wat voor vlees zit er in het ovengerecht Tavë Kosi?",
        answer: "Lamsvlees",
        explanation: "Het antwoord is Lamsvlees; dit beantwoordt de vraag: Wat voor vlees zit er in het ovengerecht Tavë Kosi?"
      },
      {
        question: "Klopt het dat gastvrijheid (besa) belangrijk is in de Albanese cultuur?",
        answer: "Waar",
        explanation: "De bewering is waar: gastvrijheid (besa) belangrijk is in de Albanese cultuur."
      },
      {
        question: "Klopt het dat Albanië een vlakke polder zonder bergen is?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: vol met ruige bergen."
      },
      {
        question: "Klopt het dat Albanië aan zee ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Albanië aan zee ligt."
      }
    ]
  },
  AND: {
    name: "Andorra",
    questions: [
      {
        question: "Wat is de enige officiële landstaal van Andorra?",
        answer: "Catalaans",
        explanation: "Het antwoord is Catalaans; dit beantwoordt de vraag: Wat is de enige officiële landstaal van Andorra?"
      },
      {
        question: "Klopt het dat mensen op pleinen de cirkeldans sardana dansen?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen op pleinen de cirkeldans sardana dansen."
      },
      {
        question: "Klopt het dat escudella een lichte zomersalade is?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: een stevige winterse stoofpot."
      },
      {
        question: "Klopt het dat Andorra door twee covorsten wordt bestuurd?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: de president van Frankrijk en de bisschop van Urgell."
      },
      {
        question: "Klopt het dat Andorra hoog in de Pyreneeën ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Andorra hoog in de Pyreneeën ligt."
      },
      {
        question: "Klopt het dat Andorra aan Duitsland grenst?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: tussen Frankrijk en Spanje."
      }
    ]
  },
  ARM: {
    name: "Armenië",
    questions: [
      {
        question: "Klopt het dat Armenië een eigen, uniek alfabet heeft?",
        answer: "Waar",
        explanation: "De bewering is waar: Armenië een eigen, uniek alfabet heeft."
      },
      {
        question: "Van welk hout wordt het blaasinstrument de duduk gemaakt?",
        answer: "Abrikozenhout",
        explanation: "Het antwoord is Abrikozenhout; dit beantwoordt de vraag: Van welk hout wordt het blaasinstrument de duduk gemaakt?"
      },
      {
        question: "Klopt het dat gevulde wijnbladeren (tolma) in Armenië populair zijn?",
        answer: "Waar",
        explanation: "De bewering is waar: gevulde wijnbladeren (tolma) in Armenië populair zijn."
      },
      {
        question: "Klopt het dat mensen tijdens het feest Vardavar water over elkaar heen gooien?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen tijdens het feest Vardavar water over elkaar heen gooien."
      },
      {
        question: "Welke besneeuwde berg staat symbool voor Armenië?",
        answer: "Berg Ararat",
        explanation: "Het antwoord is Berg Ararat; dit beantwoordt de vraag: Welke besneeuwde berg staat symbool voor Armenië?"
      },
      {
        question: "Klopt het dat Armenië het eerste christelijke land ter wereld was?",
        answer: "Waar",
        explanation: "De bewering is waar: Armenië het eerste christelijke land ter wereld was."
      }
    ]
  },
  BIH: {
    name: "Bosnië en Herzegovina",
    questions: [
      {
        question: "Klopt het dat men in Bosnië een Slavische taal spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Bosnië een Slavische taal spreekt."
      },
      {
        question: "Hoe heet de melancholische zangstijl uit Bosnië?",
        answer: "Sevdah",
        explanation: "Het antwoord is Sevdah; dit beantwoordt de vraag: Hoe heet de melancholische zangstijl uit Bosnië?"
      },
      {
        question: "Klopt het dat ćevapi kleine gegrilde gehaktrolletjes zijn?",
        answer: "Waar",
        explanation: "De bewering is waar: ćevapi kleine gegrilde gehaktrolletjes zijn."
      },
      {
        question: "Klopt het dat men in Bosnië koffie zet in een koperen kannetje (džezva)?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Bosnië koffie zet in een koperen kannetje (džezva)."
      },
      {
        question: "Klopt het dat de beroemde oude stenen brug in de stad Mostar staat?",
        answer: "Waar",
        explanation: "De bewering is waar: de beroemde oude stenen brug in de stad Mostar staat."
      },
      {
        question: "Klopt het dat Bosnië een heel lange kust van 1.000 km heeft?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: slechts een piepkleine kuststrook van ongeveer 20 km."
      }
    ]
  },
  BGR: {
    name: "Bulgarije",
    questions: [
      {
        question: "Klopt het dat het Cyrillische schrift in Bulgarije is ontwikkeld?",
        answer: "Waar",
        explanation: "De bewering is waar: het Cyrillische schrift in Bulgarije is ontwikkeld."
      },
      {
        question: "Klopt het dat men in Bulgarije de doedelzak van geitenleer (gaida) bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Bulgarije de doedelzak van geitenleer (gaida) bespeelt."
      },
      {
        question: "Wat is Banitsa voor een gerecht?",
        answer: "Bladerdeeggebak met witte schapenkaas",
        explanation: "Het antwoord is Bladerdeeggebak met witte schapenkaas; dit beantwoordt de vraag: Wat is Banitsa voor een gerecht?"
      },
      {
        question: "Klopt het dat mensen in de lente rood-witte touwtjes (martenitsa) aan elkaar geven?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen in de lente rood-witte touwtjes (martenitsa) aan elkaar geven."
      },
      {
        question: "Waarvoor staat de Bulgaarse Rozenvallei bekend?",
        answer: "De productie van rozenolie",
        explanation: "Het antwoord is De productie van rozenolie; dit beantwoordt de vraag: Waarvoor staat de Bulgaarse Rozenvallei bekend?"
      },
      {
        question: "Klopt het dat Bulgarije aan de Zwarte Zee ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Bulgarije aan de Zwarte Zee ligt."
      }
    ]
  },
  CYP: {
    name: "Cyprus",
    questions: [
      {
        question: "Welke twee talen worden op Cyprus gesproken?",
        answer: "Grieks en Turks",
        explanation: "Het antwoord is Grieks en Turks; dit beantwoordt de vraag: Welke twee talen worden op Cyprus gesproken?"
      },
      {
        question: "Klopt het dat Cyprioten dansen met glazen op hun hoofd?",
        answer: "Niet waar",
        explanation: "De bewering is niet waar: Cyprioten dansen met glazen op hun hoofd."
      },
      {
        question: "Klopt het dat de kaas halloumi gegrild kan worden zonder te smelten?",
        answer: "Waar",
        explanation: "De bewering is waar: de kaas halloumi gegrild kan worden zonder te smelten."
      },
      {
        question: "Klopt het dat men op Cyprus het waterfestival Kataklysmos viert?",
        answer: "Waar",
        explanation: "De bewering is waar: men op Cyprus het waterfestival Kataklysmos viert."
      },
      {
        question: "Klopt het dat zeeschildpadden hun eieren op de stranden van Cyprus leggen?",
        answer: "Waar",
        explanation: "De bewering is waar: zeeschildpadden hun eieren op de stranden van Cyprus leggen."
      },
      {
        question: "Klopt het dat Cyprus een schiereiland op het vasteland is?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: een eiland in de Middellandse Zee."
      }
    ]
  },
  EST: {
    name: "Estland",
    questions: [
      {
        question: "Klopt het dat de Estse taal op de Finse taal lijkt?",
        answer: "Waar",
        explanation: "De bewering is waar: de Estse taal op de Finse taal lijkt."
      },
      {
        question: "Klopt het dat er in Estland regelmatig een massaal zangfestival plaatsvindt?",
        answer: "Waar",
        explanation: "De bewering is waar: er in Estland regelmatig een massaal zangfestival plaatsvindt."
      },
      {
        question: "Klopt het dat donker roggebrood belangrijk is in de Estse keuken?",
        answer: "Waar",
        explanation: "De bewering is waar: donker roggebrood belangrijk is in de Estse keuken."
      },
      {
        question: "Klopt het dat Esten vrijwel alles digitaal online regelen?",
        answer: "Waar",
        explanation: "De bewering is waar: Esten vrijwel alles digitaal online regelen."
      },
      {
        question: "Klopt het dat meer dan 40% van Estland met bos is bedekt?",
        answer: "Waar",
        explanation: "De bewering is waar: meer dan 40% van Estland met bos is bedekt."
      },
      {
        question: "Wat is de hoofdstad van Estland?",
        answer: "Tallinn",
        explanation: "Het antwoord is Tallinn; dit beantwoordt de vraag: Wat is de hoofdstad van Estland?"
      }
    ]
  },
  GEO: {
    name: "Georgië",
    questions: [
      {
        question: "Klopt het dat het Georgisch een eigen, sierlijk alfabet heeft?",
        answer: "Waar",
        explanation: "De bewering is waar: het Georgisch een eigen, sierlijk alfabet heeft."
      },
      {
        question: "Klopt het dat de Georgische meerstemmige zang op de UNESCO-lijst staat?",
        answer: "Waar",
        explanation: "De bewering is waar: de Georgische meerstemmige zang op de UNESCO-lijst staat."
      },
      {
        question: "Wat voor gerecht is khachapuri?",
        answer: "Brood gevuld met gesmolten kaas en ei",
        explanation: "Het antwoord is Brood gevuld met gesmolten kaas en ei; dit beantwoordt de vraag: Wat voor gerecht is khachapuri?"
      },
      {
        question: "Klopt het dat men in Georgië al duizenden jaren wijn laat rijpen in ondergrondse kleipotten?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Georgië al duizenden jaren wijn laat rijpen in ondergrondse kleipotten."
      },
      {
        question: "Klopt het dat Georgië in de bergen van de Kaukasus ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Georgië in de bergen van de Kaukasus ligt."
      },
      {
        question: "Klopt het dat Georgië in Zuid-Amerika ligt?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: in de Kaukasus, op de grens van Europa en Azië."
      }
    ]
  },
  LVA: {
    name: "Letland",
    questions: [
      {
        question: "Klopt het dat het Lets tot de Baltische talen behoort?",
        answer: "Waar",
        explanation: "De bewering is waar: het Lets tot de Baltische talen behoort."
      },
      {
        question: "Hoe heten de korte Letse volksliedjes?",
        answer: "Dainas",
        explanation: "Het antwoord is Dainas; dit beantwoordt de vraag: Hoe heten de korte Letse volksliedjes?"
      },
      {
        question: "Klopt het dat men in Letland traditioneel grijze erwten met spek eet?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Letland traditioneel grijze erwten met spek eet."
      },
      {
        question: "Klopt het dat men in Letland het midzomerfeest viert met kampvuren?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Letland het midzomerfeest viert met kampvuren."
      },
      {
        question: "Welke fossiele hars spoelt er aan op de Letse stranden?",
        answer: "Barnsteen",
        explanation: "Het antwoord is Barnsteen; dit beantwoordt de vraag: Welke fossiele hars spoelt er aan op de Letse stranden?"
      },
      {
        question: "Wat is de hoofdstad van Letland?",
        answer: "Riga",
        explanation: "Het antwoord is Riga; dit beantwoordt de vraag: Wat is de hoofdstad van Letland?"
      }
    ]
  },
  LIE: {
    name: "Liechtenstein",
    questions: [
      {
        question: "Welke taal spreekt men in Liechtenstein?",
        answer: "Duits",
        explanation: "Het antwoord is Duits; dit beantwoordt de vraag: Welke taal spreekt men in Liechtenstein?"
      },
      {
        question: "Klopt het dat Liechtenstein een eigen, groot leger heeft?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: het land heeft geen leger."
      },
      {
        question: "Klopt het dat käsknöpfle deegknopjes met kaas zijn?",
        answer: "Waar",
        explanation: "De bewering is waar: käsknöpfle deegknopjes met kaas zijn."
      },
      {
        question: "Klopt het dat het staatshoofd van Liechtenstein een prins is?",
        answer: "Waar",
        explanation: "De bewering is waar: het staatshoofd van Liechtenstein een prins is."
      },
      {
        question: "Klopt het dat Liechtenstein tussen Zwitserland en Oostenrijk ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Liechtenstein tussen Zwitserland en Oostenrijk ligt."
      },
      {
        question: "Klopt het dat Liechtenstein aan zee grenst?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: het is een volledig ingesloten dwergstaat."
      }
    ]
  },
  LTU: {
    name: "Litouwen",
    questions: [
      {
        question: "Klopt het dat het Litouws een van de oudste nog levende talen is?",
        answer: "Waar",
        explanation: "De bewering is waar: het Litouws een van de oudste nog levende talen is."
      },
      {
        question: "Hoe heten de traditionele meerstemmige Litouwse liederen?",
        answer: "Sutartinės",
        explanation: "Het antwoord is Sutartinės; dit beantwoordt de vraag: Hoe heten de traditionele meerstemmige Litouwse liederen?"
      },
      {
        question: "Waarom lijken cepelinai (knoedels) op zeppelins?",
        answer: "Vanwege hun grote, langwerpige vorm",
        explanation: "Het antwoord is Vanwege hun grote, langwerpige vorm; dit beantwoordt de vraag: Waarom lijken cepelinai (knoedels) op zeppelins?"
      },
      {
        question: "Klopt het dat men in Litouwen het midzomerfeest Joninės viert?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Litouwen het midzomerfeest Joninės viert."
      },
      {
        question: "Klopt het dat de Koerse Schoorwal met zandduinen in Litouwen ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: de Koerse Schoorwal met zandduinen in Litouwen ligt."
      },
      {
        question: "Wat is de hoofdstad van Litouwen?",
        answer: "Vilnius",
        explanation: "Het antwoord is Vilnius; dit beantwoordt de vraag: Wat is de hoofdstad van Litouwen?"
      }
    ]
  },
  LUX: {
    name: "Luxemburg",
    questions: [
      {
        question: "Hoeveel officiële talen heeft Luxemburg?",
        answer: "3 talen",
        explanation: "Het antwoord is 3 talen; aanvullende uitleg: Luxemburgs, Frans, Duits."
      },
      {
        question: "Klopt het dat Luxemburg een rijke blaasmuziektraditie heeft?",
        answer: "Waar",
        explanation: "De bewering is waar: Luxemburg een rijke blaasmuziektraditie heeft."
      },
      {
        question: "Klopt het dat judd mat gaardebounen gerookt varkensvlees met tuinbonen is?",
        answer: "Waar",
        explanation: "De bewering is waar: judd mat gaardebounen gerookt varkensvlees met tuinbonen is."
      },
      {
        question: "Klopt het dat de leider van het land een groothertog is?",
        answer: "Waar",
        explanation: "De bewering is waar: de leider van het land een groothertog is."
      },
      {
        question: "Klopt het dat de regio Mullerthal bekendstaat als het Klein Zwitserland van Luxemburg?",
        answer: "Waar",
        explanation: "De bewering is waar: de regio Mullerthal bekendstaat als het Klein Zwitserland van Luxemburg."
      },
      {
        question: "Klopt het dat Luxemburg het armste land van Europa is?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: een van de rijkste landen ter wereld."
      }
    ]
  },
  MLT: {
    name: "Malta",
    questions: [
      {
        question: "Klopt het dat het Maltees de enige Semitische taal in Europa is?",
        answer: "Waar",
        explanation: "De bewering is waar: het Maltees de enige Semitische taal in Europa is."
      },
      {
        question: "Klopt het dat għana een traditionele Maltese zangstijl is?",
        answer: "Waar",
        explanation: "De bewering is waar: għana een traditionele Maltese zangstijl is."
      },
      {
        question: "Wat zit er in het bladerdeeggebakje pastizzi?",
        answer: "Ricotta of erwtenpuree",
        explanation: "Het antwoord is Ricotta of erwtenpuree; dit beantwoordt de vraag: Wat zit er in het bladerdeeggebakje pastizzi?"
      },
      {
        question: "Klopt het dat dorpen op Malta veel vuurwerk afsteken bij zomerfeesten?",
        answer: "Waar",
        explanation: "De bewering is waar: dorpen op Malta veel vuurwerk afsteken bij zomerfeesten."
      },
      {
        question: "Klopt het dat het water bij de Blue Lagoon helderblauw is?",
        answer: "Waar",
        explanation: "De bewering is waar: het water bij de Blue Lagoon helderblauw is."
      },
      {
        question: "Klopt het dat Malta een eilandstaat in de Middellandse Zee is?",
        answer: "Waar",
        explanation: "De bewering is waar: Malta een eilandstaat in de Middellandse Zee is."
      }
    ]
  },
  MDA: {
    name: "Moldavië",
    questions: [
      {
        question: "Klopt het dat de taal van Moldavië op het Roemeens lijkt?",
        answer: "Waar",
        explanation: "De bewering is waar: de taal van Moldavië op het Roemeens lijkt."
      },
      {
        question: "Klopt het dat Lăutari-muzikanten vrolijke volksmuziek maken?",
        answer: "Waar",
        explanation: "De bewering is waar: Lăutari-muzikanten vrolijke volksmuziek maken."
      },
      {
        question: "Wat voor vulling zit er vaak in plăcintă-deegtaartjes?",
        answer: "Kwark, kool of kersen",
        explanation: "Het antwoord is Kwark, kool of kersen; dit beantwoordt de vraag: Wat voor vulling zit er vaak in plăcintă-deegtaartjes?"
      },
      {
        question: "Klopt het dat men in Moldavië jaarlijks de Nationale Wijndag viert?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Moldavië jaarlijks de Nationale Wijndag viert."
      },
      {
        question: "Klopt het dat Moldavië reusachtige ondergrondse wijnkelders heeft?",
        answer: "Waar",
        explanation: "De bewering is waar: Moldavië reusachtige ondergrondse wijnkelders heeft."
      },
      {
        question: "Klopt het dat Moldavië aan de Atlantische Oceaan ligt?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: ingesloten land."
      }
    ]
  },
  MCO: {
    name: "Monaco",
    questions: [
      {
        question: "Wat is de officiële taal van Monaco?",
        answer: "Frans",
        explanation: "Het antwoord is Frans; dit beantwoordt de vraag: Wat is de officiële taal van Monaco?"
      },
      {
        question: "Klopt het dat het beroemde circusfestival in Monaco plaatsvindt?",
        answer: "Waar",
        explanation: "De bewering is waar: het beroemde circusfestival in Monaco plaatsvindt."
      },
      {
        question: "Klopt het dat barbagiuan een gefrituurd hapje met snijbiet is?",
        answer: "Waar",
        explanation: "De bewering is waar: barbagiuan een gefrituurd hapje met snijbiet is."
      },
      {
        question: "Klopt het dat er jaarlijks Formule 1-wagens door de straten van Monaco rijden?",
        answer: "Waar",
        explanation: "De bewering is waar: er jaarlijks Formule 1-wagens door de straten van Monaco rijden."
      },
      {
        question: "Klopt het dat Monaco aan de Franse Rivièra ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Monaco aan de Franse Rivièra ligt."
      },
      {
        question: "Klopt het dat Monaco na Vaticaanstad het kleinste land ter wereld is?",
        answer: "Waar",
        explanation: "De bewering is waar: Monaco na Vaticaanstad het kleinste land ter wereld is."
      }
    ]
  },
  MNE: {
    name: "Montenegro",
    questions: [
      {
        question: "Wat betekent de landnaam Montenegro?",
        answer: "Zwarte Berg",
        explanation: "Het antwoord is Zwarte Berg; dit beantwoordt de vraag: Wat betekent de landnaam Montenegro?"
      },
      {
        question: "Klopt het dat men in Montenegro de eensnarige viool gusle bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Montenegro de eensnarige viool gusle bespeelt."
      },
      {
        question: "Uit welk Montenegrijns bergdorp komt de beroemde gerookte ham?",
        answer: "Njeguši",
        explanation: "Het antwoord is Njeguši; dit beantwoordt de vraag: Uit welk Montenegrijns bergdorp komt de beroemde gerookte ham?"
      },
      {
        question: "Klopt het dat families hun beschermheilige (slava) vieren?",
        answer: "Waar",
        explanation: "De bewering is waar: families hun beschermheilige (slava) vieren."
      },
      {
        question: "Klopt het dat Montenegro een diepe, fjordachtige baai heeft (de Baai van Kotor)?",
        answer: "Waar",
        explanation: "De bewering is waar: Montenegro een diepe, fjordachtige baai heeft (de Baai van Kotor)."
      },
      {
        question: "Klopt het dat Montenegro in Oost-Azië ligt?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: in Zuid-Europa op de Balkan."
      }
    ]
  },
  MKD: {
    name: "Noord-Macedonië",
    questions: [
      {
        question: "Klopt het dat het Macedonisch het Cyrillische schrift gebruikt?",
        answer: "Waar",
        explanation: "De bewering is waar: het Macedonisch het Cyrillische schrift gebruikt."
      },
      {
        question: "Klopt het dat men grote houten trommels (tapan) bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men grote houten trommels (tapan) bespeelt."
      },
      {
        question: "Wat voor gerecht is tavče gravče?",
        answer: "Witte bonen gegaard in een aarden pot",
        explanation: "Het antwoord is Witte bonen gegaard in een aarden pot; dit beantwoordt de vraag: Wat voor gerecht is tavče gravče?"
      },
      {
        question: "Klopt het dat traditionele dorpsbruiloften meerdere dagen duren?",
        answer: "Waar",
        explanation: "De bewering is waar: traditionele dorpsbruiloften meerdere dagen duren."
      },
      {
        question: "Klopt het dat Noord-Macedonië een oud bergmeer heeft (het Meer van Ohrid)?",
        answer: "Waar",
        explanation: "De bewering is waar: Noord-Macedonië een oud bergmeer heeft (het Meer van Ohrid)."
      },
      {
        question: "Wat is de hoofdstad van Noord-Macedonië?",
        answer: "Skopje",
        explanation: "Het antwoord is Skopje; dit beantwoordt de vraag: Wat is de hoofdstad van Noord-Macedonië?"
      }
    ]
  },
  SMR: {
    name: "San Marino",
    questions: [
      {
        question: "Welke taal spreekt men in San Marino?",
        answer: "Italiaans",
        explanation: "Het antwoord is Italiaans; dit beantwoordt de vraag: Welke taal spreekt men in San Marino?"
      },
      {
        question: "Klopt het dat muzikanten in middeleeuwse kleding trommelen?",
        answer: "Waar",
        explanation: "De bewering is waar: muzikanten in middeleeuwse kleding trommelen."
      },
      {
        question: "Klopt het dat torta tre monti een wafeltaart met laagjes chocolade is?",
        answer: "Waar",
        explanation: "De bewering is waar: torta tre monti een wafeltaart met laagjes chocolade is."
      },
      {
        question: "Klopt het dat men wedstrijden in kruisboogschieten houdt?",
        answer: "Waar",
        explanation: "De bewering is waar: men wedstrijden in kruisboogschieten houdt."
      },
      {
        question: "Klopt het dat San Marino op de berg Monte Titano met drie torens ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: San Marino op de berg Monte Titano met drie torens ligt."
      },
      {
        question: "Klopt het dat San Marino ingesloten ligt in Spanje?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: ingesloten in Italië."
      }
    ]
  },
  SRB: {
    name: "Servië",
    questions: [
      {
        question: "Klopt het dat het Servisch zowel het Cyrillische als het Latijnse alfabet gebruikt?",
        answer: "Waar",
        explanation: "De bewering is waar: het Servisch zowel het Cyrillische als het Latijnse alfabet gebruikt."
      },
      {
        question: "Klopt het dat Servië bekendstaat om opzwepende koperblazers (brassbands)?",
        answer: "Waar",
        explanation: "De bewering is waar: Servië bekendstaat om opzwepende koperblazers (brassbands)."
      },
      {
        question: "Klopt het dat ćevapčići gegrilde gehaktrolletjes zijn?",
        answer: "Waar",
        explanation: "De bewering is waar: ćevapčići gegrilde gehaktrolletjes zijn."
      },
      {
        question: "Klopt het dat Servische families hun familiedag (slava) vieren?",
        answer: "Waar",
        explanation: "De bewering is waar: Servische families hun familiedag (slava) vieren."
      },
      {
        question: "Klopt het dat de Donau door de hoofdstad Belgrado stroomt?",
        answer: "Waar",
        explanation: "De bewering is waar: de Donau door de hoofdstad Belgrado stroomt."
      },
      {
        question: "Klopt het dat de euro de officiële munteenheid van Servië is?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: de Servische Dinar."
      }
    ]
  },
  SVN: {
    name: "Slovenië",
    questions: [
      {
        question: "Klopt het dat de Sloveense taal de zeldzame dualis (tweevoud) heeft?",
        answer: "Waar",
        explanation: "De bewering is waar: de Sloveense taal de zeldzame dualis (tweevoud) heeft."
      },
      {
        question: "Klopt het dat de accordeon belangrijk is in Sloveense polkamuziek?",
        answer: "Waar",
        explanation: "De bewering is waar: de accordeon belangrijk is in Sloveense polkamuziek."
      },
      {
        question: "Wat voor traditioneel gebak is potica?",
        answer: "Een gerolde cake gevuld met walnoten",
        explanation: "Het antwoord is Een gerolde cake gevuld met walnoten; dit beantwoordt de vraag: Wat voor traditioneel gebak is potica?"
      },
      {
        question: "Klopt het dat mensen zich verkleden als harige Kurents met bellen?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen zich verkleden als harige Kurents met bellen."
      },
      {
        question: "Klopt het dat het Meer van Bled, met een kerkje op een eiland, in Slovenië ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: het Meer van Bled, met een kerkje op een eiland, in Slovenië ligt."
      },
      {
        question: "Wat is de hoofdstad van Slovenië?",
        answer: "Ljubljana",
        explanation: "Het antwoord is Ljubljana; dit beantwoordt de vraag: Wat is de hoofdstad van Slovenië?"
      }
    ]
  },
  SVK: {
    name: "Slowakije",
    questions: [
      {
        question: "Klopt het dat men in Slowakije de Slowaakse taal spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Slowakije de Slowaakse taal spreekt."
      },
      {
        question: "Welk instrument is de fujara?",
        answer: "Een gigantische houten herdersfluit",
        explanation: "Het antwoord is Een gigantische houten herdersfluit; dit beantwoordt de vraag: Welk instrument is de fujara?"
      },
      {
        question: "Wat voor kaas zit er op bryndzové halušky (knoedels)?",
        answer: "Schapenkaas",
        explanation: "Het antwoord is Schapenkaas; aanvullende uitleg: Bryndza."
      },
      {
        question: "Klopt het dat men in Slowakije in de zomer folkloristische feesten viert?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Slowakije in de zomer folkloristische feesten viert."
      },
      {
        question: "Hoe heet de bekende hoge bergketen in Slowakije?",
        answer: "De Hoge Tatra",
        explanation: "Het antwoord is De Hoge Tatra; dit beantwoordt de vraag: Hoe heet de bekende hoge bergketen in Slowakije?"
      },
      {
        question: "Klopt het dat Praag de hoofdstad van Slowakije is?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: Bratislava."
      }
    ]
  },
  VAT: {
    name: "Vaticaanstad",
    questions: [
      {
        question: "Klopt het dat het Latijn officieel wordt gebruikt in Vaticaanstad?",
        answer: "Waar",
        explanation: "De bewering is waar: het Latijn officieel wordt gebruikt in Vaticaanstad."
      },
      {
        question: "Klopt het dat er orgelmuziek klinkt in de Sint-Pietersbasiliek?",
        answer: "Waar",
        explanation: "De bewering is waar: er orgelmuziek klinkt in de Sint-Pietersbasiliek."
      },
      {
        question: "Welke keuken eten de inwoners van Vaticaanstad?",
        answer: "De Italiaanse keuken",
        explanation: "Vaticaanstad ligt in Rome, waar de lokale keuken Italiaans en Romeins is."
      },
      {
        question: "Wie is het staatshoofd van Vaticaanstad?",
        answer: "De paus",
        explanation: "Het antwoord is De paus; dit beantwoordt de vraag: Wie is het staatshoofd van Vaticaanstad?"
      },
      {
        question: "Klopt het dat Vaticaanstad een eigen vliegveld met grote landingsbanen heeft?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: daar is het land veel te klein voor."
      },
      {
        question: "Klopt het dat Vaticaanstad het kleinste land ter wereld is?",
        answer: "Waar",
        explanation: "De bewering is waar: Vaticaanstad het kleinste land ter wereld is."
      }
    ]
  },
  BLR: {
    name: "Wit-Rusland",
    questions: [
      {
        question: "Klopt het dat men in Wit-Rusland zowel Wit-Russisch als Russisch spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Wit-Rusland zowel Wit-Russisch als Russisch spreekt."
      },
      {
        question: "Klopt het dat men het hakkebord (cymbaly) bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men het hakkebord (cymbaly) bespeelt."
      },
      {
        question: "Wat zijn Draniki?",
        answer: "Aardappelpannenkoekjes",
        explanation: "Het antwoord is Aardappelpannenkoekjes; dit beantwoordt de vraag: Wat zijn Draniki?"
      },
      {
        question: "Klopt het dat men het Kupala-feest viert met kampvuren?",
        answer: "Waar",
        explanation: "De bewering is waar: men het Kupala-feest viert met kampvuren."
      },
      {
        question: "Klopt het dat de Europese bizon in de oerbossen leeft?",
        answer: "Waar",
        explanation: "De bewering is waar: de Europese bizon in de oerbossen leeft."
      },
      {
        question: "Wat is de hoofdstad van Wit-Rusland?",
        answer: "Minsk",
        explanation: "Het antwoord is Minsk; dit beantwoordt de vraag: Wat is de hoofdstad van Wit-Rusland?"
      }
    ]
  },
  RUS: {
    name: "Rusland",
    questions: [
      {
        question: "Klopt het dat de Russische taal het Cyrillische alfabet gebruikt?",
        answer: "Waar",
        explanation: "De bewering is waar: de Russische taal het Cyrillische alfabet gebruikt."
      },
      {
        question: "Hoe heet het driehoekige snaarinstrument met drie snaren?",
        answer: "De balalaika",
        explanation: "Het antwoord is De balalaika; dit beantwoordt de vraag: Hoe heet het driehoekige snaarinstrument met drie snaren?"
      },
      {
        question: "Klopt het dat pelmeni gekookte deegkussentjes met gehakt zijn?",
        answer: "Waar",
        explanation: "De bewering is waar: pelmeni gekookte deegkussentjes met gehakt zijn."
      },
      {
        question: "Hoe heten de houten, beschilderde poppetjes die in elkaar passen?",
        answer: "Matroesjka’s",
        explanation: "Het antwoord is Matroesjka’s; dit beantwoordt de vraag: Hoe heten de houten, beschilderde poppetjes die in elkaar passen?"
      },
      {
        question: "Klopt het dat het Siberische Baikalmeer het diepste meer ter wereld is?",
        answer: "Waar",
        explanation: "De bewering is waar: het Siberische Baikalmeer het diepste meer ter wereld is."
      },
      {
        question: "Klopt het dat Rusland het kleinste land ter wereld is?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: het allergrootste qua landoppervlakte."
      }
    ]
  },
  JPN: {
    name: "Japan",
    questions: [
      {
        question: "Klopt het dat de Japanse taal drie verschillende schriftsoorten gebruikt?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: hiragana, katakana en kanji."
      },
      {
        question: "Hoe heten de grote, houten, traditionele Japanse trommels?",
        answer: "Taiko-trommels",
        explanation: "Het antwoord is Taiko-trommels; dit beantwoordt de vraag: Hoe heten de grote, houten, traditionele Japanse trommels?"
      },
      {
        question: "Klopt het dat sushi wordt gemaakt van gekookte rijst, vaak met vis of zeewier?",
        answer: "Waar",
        explanation: "De bewering is waar: sushi wordt gemaakt van gekookte rijst, vaak met vis of zeewier."
      },
      {
        question: "Hoe noemt men het bewonderen van de kersenbloesem in de lente?",
        answer: "Hanami",
        explanation: "Het antwoord is Hanami; dit beantwoordt de vraag: Hoe noemt men het bewonderen van de kersenbloesem in de lente?"
      },
      {
        question: "Klopt het dat de berg Fuji een actieve vulkaan met een besneeuwde top is?",
        answer: "Waar",
        explanation: "De bewering is waar: de berg Fuji een actieve vulkaan met een besneeuwde top is."
      },
      {
        question: "Klopt het dat Japan op het vasteland van Azië ligt?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: het is een eilandengroep."
      }
    ]
  },
  CHN: {
    name: "China",
    questions: [
      {
        question: "Klopt het dat het Mandarijn-Chinees duizenden karakters heeft in plaats van een alfabet?",
        answer: "Waar",
        explanation: "De bewering is waar: het Mandarijn-Chinees duizenden karakters heeft in plaats van een alfabet."
      },
      {
        question: "Klopt het dat de erhu een traditioneel, tweesnarig Chinees instrument is?",
        answer: "Waar",
        explanation: "De bewering is waar: de erhu een traditioneel, tweesnarig Chinees instrument is."
      },
      {
        question: "Klopt het dat Chinezen hun maaltijden eten met mes en vork?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: met houten of bamboe eetstokjes."
      },
      {
        question: "Met welke kleur lampions viert men het Chinees Nieuwjaar?",
        answer: "Rode lampions",
        explanation: "Het antwoord is Rode lampions; dit beantwoordt de vraag: Met welke kleur lampions viert men het Chinees Nieuwjaar?"
      },
      {
        question: "Welk bekend zwart-wit dier dat bamboe eet komt uit China?",
        answer: "De reuzenpanda",
        explanation: "Het antwoord is De reuzenpanda; dit beantwoordt de vraag: Welk bekend zwart-wit dier dat bamboe eet komt uit China?"
      },
      {
        question: "Hoeveel kilometer lang is de Chinese Muur ongeveer (duizenden km of 10 km)?",
        answer: "Duizenden kilometers",
        explanation: "Het antwoord is Duizenden kilometers; aanvullende uitleg: ruim 20.000 km totaal."
      }
    ]
  },
  IND: {
    name: "India",
    questions: [
      {
        question: "Klopt het dat er in India maar één enkele taal wordt gesproken?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: tientallen officiële talen zoals Hindi en Engels."
      },
      {
        question: "Welk lang, traditioneel snaarinstrument werd beroemd door Ravi Shankar?",
        answer: "De sitar",
        explanation: "Het antwoord is De sitar; dit beantwoordt de vraag: Welk lang, traditioneel snaarinstrument werd beroemd door Ravi Shankar?"
      },
      {
        question: "Klopt het dat het Indiase platbrood naan wordt gebakken in een kleioven (tandoor)?",
        answer: "Waar",
        explanation: "De bewering is waar: het Indiase platbrood naan wordt gebakken in een kleioven (tandoor)."
      },
      {
        question: "Hoe heet het voorjaarsfeest waarbij mensen met gekleurd poeder gooien?",
        answer: "Holi",
        explanation: "Het antwoord is Holi; aanvullende uitleg: Holi-Phagwa."
      },
      {
        question: "Klopt het dat de heilige rivier de Ganges door het noorden van India stroomt?",
        answer: "Waar",
        explanation: "De bewering is waar: de heilige rivier de Ganges door het noorden van India stroomt."
      },
      {
        question: "In welke Indiase stad staat het witte marmeren monument de Taj Mahal?",
        answer: "Agra",
        explanation: "Het antwoord is Agra; dit beantwoordt de vraag: In welke Indiase stad staat het witte marmeren monument de Taj Mahal?"
      }
    ]
  },
  IDN: {
    name: "Indonesië",
    questions: [
      {
        question: "Wat is de officiële landstaal van Indonesië?",
        answer: "Bahasa Indonesia",
        explanation: "Het antwoord is Bahasa Indonesia; dit beantwoordt de vraag: Wat is de officiële landstaal van Indonesië?"
      },
      {
        question: "Klopt het dat een traditioneel gamelanorkest voornamelijk uit gongs en metallofoons bestaat?",
        answer: "Waar",
        explanation: "De bewering is waar: een traditioneel gamelanorkest voornamelijk uit gongs en metallofoons bestaat."
      },
      {
        question: "Klopt het dat nasi goreng een bekend Indonesisch rijstgerecht is?",
        answer: "Waar",
        explanation: "De bewering is waar: nasi goreng een bekend Indonesisch rijstgerecht is."
      },
      {
        question: "Wat voor soort poppen gebruikt men bij het schaduwspel Wayang Kulit?",
        answer: "Leren poppen",
        explanation: "Het antwoord is Leren poppen; dit beantwoordt de vraag: Wat voor soort poppen gebruikt men bij het schaduwspel Wayang Kulit?"
      },
      {
        question: "Klopt het dat de grootste hagedis ter wereld (de komodovaraan) op Indonesische eilanden leeft?",
        answer: "Waar",
        explanation: "De bewering is waar: de grootste hagedis ter wereld (de komodovaraan) op Indonesische eilanden leeft."
      },
      {
        question: "Klopt het dat Indonesië uit minder dan 10 eilanden bestaat?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: uit ruim 17.000 eilanden."
      }
    ]
  },
  THA: {
    name: "Thailand",
    questions: [
      {
        question: "Klopt het dat de Thaise taal een eigen, sierlijk alfabet met ronde letters heeft?",
        answer: "Waar",
        explanation: "De bewering is waar: de Thaise taal een eigen, sierlijk alfabet met ronde letters heeft."
      },
      {
        question: "Wat is de nationale gevechtskunst van Thailand?",
        answer: "Muay Thai",
        explanation: "Het antwoord is Muay Thai; aanvullende uitleg: Thais boksen."
      },
      {
        question: "Klopt het dat pad thai een traditioneel gerecht van roergebakken rijstnoedels is?",
        answer: "Waar",
        explanation: "De bewering is waar: pad thai een traditioneel gerecht van roergebakken rijstnoedels is."
      },
      {
        question: "Tijdens welk feest gooit iedereen op straat water over elkaar heen?",
        answer: "Songkran",
        explanation: "Het antwoord is Songkran; aanvullende uitleg: Nieuwjaarsfeest."
      },
      {
        question: "Welk dier wordt in Thailand als heilig en geluksbrengend beschouwd?",
        answer: "De olifant",
        explanation: "Het antwoord is De olifant; dit beantwoordt de vraag: Welk dier wordt in Thailand als heilig en geluksbrengend beschouwd?"
      },
      {
        question: "Wat is de drukke hoofdstad van Thailand?",
        answer: "Bangkok",
        explanation: "Het antwoord is Bangkok; dit beantwoordt de vraag: Wat is de drukke hoofdstad van Thailand?"
      }
    ]
  },
  KOR: {
    name: "Zuid-Korea",
    questions: [
      {
        question: "Hoe heet het Koreaanse alfabet dat in de 15e eeuw werd ontworpen?",
        answer: "Hangul",
        explanation: "Het antwoord is Hangul; dit beantwoordt de vraag: Hoe heet het Koreaanse alfabet dat in de 15e eeuw werd ontworpen?"
      },
      {
        question: "Welk wereldwijd populair muziekgenre (zoals BTS) komt uit Zuid-Korea?",
        answer: "K-Pop",
        explanation: "Het antwoord is K-Pop; dit beantwoordt de vraag: Welk wereldwijd populair muziekgenre (zoals BTS) komt uit Zuid-Korea?"
      },
      {
        question: "Wat voor gerecht is kimchi?",
        answer: "Pittige gefermenteerde kool of andere groenten",
        explanation: "Het antwoord is Pittige gefermenteerde kool of andere groenten; dit beantwoordt de vraag: Wat voor gerecht is kimchi?"
      },
      {
        question: "Klopt het dat mensen bij feesten kleurrijke, traditionele hanbok-kleding dragen?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen bij feesten kleurrijke, traditionele hanbok-kleding dragen."
      },
      {
        question: "Klopt het dat het vulkanische eiland Jeju een bekend eiland van Zuid-Korea is?",
        answer: "Waar",
        explanation: "De bewering is waar: het vulkanische eiland Jeju een bekend eiland van Zuid-Korea is."
      },
      {
        question: "Klopt het dat Zuid-Korea direct aan China grenst?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: alleen aan Noord-Korea."
      }
    ]
  },
  NPL: {
    name: "Nepal",
    questions: [
      {
        question: "Met welk woord begroet men elkaar in Nepal, met de handen tegen elkaar?",
        answer: "Namaste",
        explanation: "Het antwoord is Namaste; dit beantwoordt de vraag: Met welk woord begroet men elkaar in Nepal, met de handen tegen elkaar?"
      },
      {
        question: "Klopt het dat muzikanten in de Himalaya op de bamboefluit bansuri spelen?",
        answer: "Waar",
        explanation: "De bewering is waar: muzikanten in de Himalaya op de bamboefluit bansuri spelen."
      },
      {
        question: "Uit welke twee hoofdbestanddelen bestaat het dagelijkse gerecht dal bhat?",
        answer: "Linzensoep",
        explanation: "Het antwoord is Linzensoep; aanvullende uitleg: dal) en rijst (bhat."
      },
      {
        question: "Klopt het dat men honden eert met bloemenkransen tijdens het festival Tihar?",
        answer: "Waar",
        explanation: "De bewering is waar: men honden eert met bloemenkransen tijdens het festival Tihar."
      },
      {
        question: "Hoe hoog is de Mount Everest, op de grens van Nepal, ongeveer (8.848 m of 2.000 m)?",
        answer: "8.848 meter",
        explanation: "Het antwoord is 8.848 meter; aanvullende uitleg: de hoogste berg op aarde."
      },
      {
        question: "Klopt het dat de vlag van Nepal een normale, rechthoekige vorm heeft?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: de vlag bestaat uit twee driehoeken."
      }
    ]
  },
  VNM: {
    name: "Vietnam",
    questions: [
      {
        question: "Klopt het dat het Vietnamees wordt geschreven met Latijnse letters en toontekens?",
        answer: "Waar",
        explanation: "De bewering is waar: het Vietnamees wordt geschreven met Latijnse letters en toontekens."
      },
      {
        question: "Klopt het dat men de đàn bầu bespeelt, een instrument met slechts één snaar?",
        answer: "Waar",
        explanation: "De bewering is waar: men de đàn bầu bespeelt, een instrument met slechts één snaar."
      },
      {
        question: "Hoe heet de geurige Vietnamese noedelsoep die veel als ontbijt wordt gegeten?",
        answer: "Pho",
        explanation: "Het antwoord is Pho; dit beantwoordt de vraag: Hoe heet de geurige Vietnamese noedelsoep die veel als ontbijt wordt gegeten?"
      },
      {
        question: "Hoe heet de traditionele, spitse hoed van gedroogde bladeren?",
        answer: "Nón lá",
        explanation: "Het antwoord is Nón lá; dit beantwoordt de vraag: Hoe heet de traditionele, spitse hoed van gedroogde bladeren?"
      },
      {
        question: "Klopt het dat de beroemde Ha Long-baai vol steile kalkrotsen in zee ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: de beroemde Ha Long-baai vol steile kalkrotsen in zee ligt."
      },
      {
        question: "Wat is het meest gebruikte vervoermiddel in drukke Vietnamese steden?",
        answer: "De brommer / scooter",
        explanation: "Het antwoord is De brommer / scooter; dit beantwoordt de vraag: Wat is het meest gebruikte vervoermiddel in drukke Vietnamese steden?"
      }
    ]
  },
  TUR: {
    name: "Turkije",
    questions: [
      {
        question: "Klopt het dat het Turks in het Latijnse alfabet wordt geschreven?",
        answer: "Waar",
        explanation: "De bewering is waar: het Turks in het Latijnse alfabet wordt geschreven."
      },
      {
        question: "Welk langnekkig snaarinstrument wordt veel gebruikt in Turkse volksmuziek?",
        answer: "De saz",
        explanation: "Het antwoord is De saz; dit beantwoordt de vraag: Welk langnekkig snaarinstrument wordt veel gebruikt in Turkse volksmuziek?"
      },
      {
        question: "Klopt het dat baklava een hartige vleesstoofpot is?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: een zoet bladerdeeggebak met nootjes en honingsiroop."
      },
      {
        question: "Hoe heten de geestelijken die ronddraaien in lange witte gewaden?",
        answer: "Draaiende derwisjen",
        explanation: "Het antwoord is Draaiende derwisjen; dit beantwoordt de vraag: Hoe heten de geestelijken die ronddraaien in lange witte gewaden?"
      },
      {
        question: "In welke streek kun je in honderden gekleurde luchtballonnen vliegen?",
        answer: "Cappadocië",
        explanation: "Het antwoord is Cappadocië; dit beantwoordt de vraag: In welke streek kun je in honderden gekleurde luchtballonnen vliegen?"
      },
      {
        question: "Welke beroemde stad in Turkije ligt op twee continenten tegelijk?",
        answer: "Istanbul",
        explanation: "Het antwoord is Istanbul; aanvullende uitleg: Europa en Azië."
      }
    ]
  },
  SAU: {
    name: "Saoedi-Arabië",
    questions: [
      {
        question: "Klopt het dat het Arabisch van rechts naar links wordt geschreven?",
        answer: "Waar",
        explanation: "De bewering is waar: het Arabisch van rechts naar links wordt geschreven."
      },
      {
        question: "Klopt het dat men bij traditionele muziek de oud (een Arabische luit) bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men bij traditionele muziek de oud (een Arabische luit) bespeelt."
      },
      {
        question: "Welke zoete vrucht serveert men traditioneel bij sterke Arabische koffie?",
        answer: "De dadel",
        explanation: "Het antwoord is De dadel; dit beantwoordt de vraag: Welke zoete vrucht serveert men traditioneel bij sterke Arabische koffie?"
      },
      {
        question: "Naar welke heilige stad reizen miljoenen moslims voor de bedevaart?",
        answer: "Mekka",
        explanation: "Het antwoord is Mekka; dit beantwoordt de vraag: Naar welke heilige stad reizen miljoenen moslims voor de bedevaart?"
      },
      {
        question: "Heeft de dromedaris in de woestijn van Saoedi-Arabië één of twee bulten?",
        answer: "Één bult",
        explanation: "Het antwoord is Één bult; dit beantwoordt de vraag: Heeft de dromedaris in de woestijn van Saoedi-Arabië één of twee bulten?"
      },
      {
        question: "Klopt het dat het landschap van Saoedi-Arabië voor het grootste deel uit woestijn bestaat?",
        answer: "Waar",
        explanation: "De bewering is waar: het landschap van Saoedi-Arabië voor het grootste deel uit woestijn bestaat."
      }
    ]
  },
  AFG: {
    name: "Afghanistan",
    questions: [
      {
        question: "Klopt het dat men in Afghanistan Pasjtoe en Dari spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Afghanistan Pasjtoe en Dari spreekt."
      },
      {
        question: "Klopt het dat de rubab een traditioneel tokkelinstrument is?",
        answer: "Waar",
        explanation: "De bewering is waar: de rubab een traditioneel tokkelinstrument is."
      },
      {
        question: "Wat zit er in het feestgerecht Kabuli Pulao?",
        answer: "Rijst met lamsvlees, rozijnen en wortel",
        explanation: "Het antwoord is Rijst met lamsvlees, rozijnen en wortel; dit beantwoordt de vraag: Wat zit er in het feestgerecht Kabuli Pulao?"
      },
      {
        question: "Wat voor sport is Buzkashi?",
        answer: "Een ruitersport te paard met een geitenkarkas",
        explanation: "Het antwoord is Een ruitersport te paard met een geitenkarkas; dit beantwoordt de vraag: Wat voor sport is Buzkashi?"
      },
      {
        question: "Welke hoge bergketen doorkruist Afghanistan?",
        answer: "De Hindoekoesj",
        explanation: "Het antwoord is De Hindoekoesj; dit beantwoordt de vraag: Welke hoge bergketen doorkruist Afghanistan?"
      },
      {
        question: "Wat is de hoofdstad van Afghanistan?",
        answer: "Kabul",
        explanation: "Het antwoord is Kabul; dit beantwoordt de vraag: Wat is de hoofdstad van Afghanistan?"
      }
    ]
  },
  AZE: {
    name: "Azerbeidzjan",
    questions: [
      {
        question: "Klopt het dat het Azerbeidzjaans een Turkse taal is?",
        answer: "Waar",
        explanation: "De bewering is waar: het Azerbeidzjaans een Turkse taal is."
      },
      {
        question: "Klopt het dat de traditionele mugham-zang op de UNESCO-lijst staat?",
        answer: "Waar",
        explanation: "De bewering is waar: de traditionele mugham-zang op de UNESCO-lijst staat."
      },
      {
        question: "Wat is Plov voor een gerecht?",
        answer: "Een feestelijk rijstgerecht met saffraan en vlees",
        explanation: "Het antwoord is Een feestelijk rijstgerecht met saffraan en vlees; dit beantwoordt de vraag: Wat is Plov voor een gerecht?"
      },
      {
        question: "Klopt het dat men in maart het lentefeest Novruz viert?",
        answer: "Waar",
        explanation: "De bewering is waar: men in maart het lentefeest Novruz viert."
      },
      {
        question: "Klopt het dat er in het landschap moddervulkanen omhoogspuiten?",
        answer: "Waar",
        explanation: "De bewering is waar: er in het landschap moddervulkanen omhoogspuiten."
      },
      {
        question: "Klopt het dat Azerbeidzjan aan de Kaspische Zee ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Azerbeidzjan aan de Kaspische Zee ligt."
      }
    ]
  },
  BHR: {
    name: "Bahrein",
    questions: [
      {
        question: "Wat is de officiële taal van Bahrein?",
        answer: "Arabisch",
        explanation: "Het antwoord is Arabisch; dit beantwoordt de vraag: Wat is de officiële taal van Bahrein?"
      },
      {
        question: "Klopt het dat men in Bahrein van traditionele zeemansmuziek houdt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Bahrein van traditionele zeemansmuziek houdt."
      },
      {
        question: "Klopt het dat machboos een gekruid rijstgerecht met vis of vlees is?",
        answer: "Waar",
        explanation: "De bewering is waar: machboos een gekruid rijstgerecht met vis of vlees is."
      },
      {
        question: "Klopt het dat het duiken naar parels in Bahrein vroeger rijkdom bracht?",
        answer: "Waar",
        explanation: "De bewering is waar: het duiken naar parels in Bahrein vroeger rijkdom bracht."
      },
      {
        question: "Klopt het dat de ’Boom des Levens’ in Bahrein helemaal alleen in de droge woestijn staat?",
        answer: "Waar",
        explanation: "De bewering is waar: de ’Boom des Levens’ in Bahrein helemaal alleen in de droge woestijn staat."
      },
      {
        question: "Klopt het dat Bahrein een eilandstaat is?",
        answer: "Waar",
        explanation: "De bewering is waar: Bahrein een eilandstaat is."
      }
    ]
  },
  BGD: {
    name: "Bangladesh",
    questions: [
      {
        question: "Klopt het dat men in Bangladesh Bengaals spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Bangladesh Bengaals spreekt."
      },
      {
        question: "Klopt het dat de Bauls spirituele volksliederen zingen?",
        answer: "Waar",
        explanation: "De bewering is waar: de Bauls spirituele volksliederen zingen."
      },
      {
        question: "Klopt het dat men graag hilsavis met rijst eet?",
        answer: "Waar",
        explanation: "De bewering is waar: men graag hilsavis met rijst eet."
      },
      {
        question: "Klopt het dat men in april het Bengaalse Nieuwjaar viert?",
        answer: "Waar",
        explanation: "De bewering is waar: men in april het Bengaalse Nieuwjaar viert."
      },
      {
        question: "Hoe heet het grootste mangrovebos ter wereld?",
        answer: "De Sundarbans",
        explanation: "Het antwoord is De Sundarbans; dit beantwoordt de vraag: Hoe heet het grootste mangrovebos ter wereld?"
      },
      {
        question: "Klopt het dat de Bengaalse tijger in de Sundarbans leeft?",
        answer: "Waar",
        explanation: "De bewering is waar: de Bengaalse tijger in de Sundarbans leeft."
      }
    ]
  },
  BTN: {
    name: "Bhutan",
    questions: [
      {
        question: "Wat is de officiële taal van Bhutan?",
        answer: "Dzongkha",
        explanation: "Het antwoord is Dzongkha; dit beantwoordt de vraag: Wat is de officiële taal van Bhutan?"
      },
      {
        question: "Klopt het dat monniken bij tempelfeesten in kleurrijke maskers dansen?",
        answer: "Waar",
        explanation: "De bewering is waar: monniken bij tempelfeesten in kleurrijke maskers dansen."
      },
      {
        question: "Wat is ema datshi?",
        answer: "Hete pepers gekookt met gesmolten kaas",
        explanation: "Het antwoord is Hete pepers gekookt met gesmolten kaas; dit beantwoordt de vraag: Wat is ema datshi?"
      },
      {
        question: "Hoe heet het traditionele gewaad dat Bhutaanse mannen dragen?",
        answer: "Een gho",
        explanation: "Het antwoord is Een gho; dit beantwoordt de vraag: Hoe heet het traditionele gewaad dat Bhutaanse mannen dragen?"
      },
      {
        question: "Klopt het dat Bhutan geluk meet in plaats van alleen geld?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: het Bruto Nationaal Geluk."
      },
      {
        question: "Klopt het dat Bhutan hoog in de Himalaya ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Bhutan hoog in de Himalaya ligt."
      }
    ]
  },
  BRN: {
    name: "Brunei",
    questions: [
      {
        question: "Wat is de officiële taal in Brunei?",
        answer: "Maleis",
        explanation: "Het antwoord is Maleis; dit beantwoordt de vraag: Wat is de officiële taal in Brunei?"
      },
      {
        question: "Klopt het dat muzikanten bij hofceremonies op gongs spelen?",
        answer: "Waar",
        explanation: "De bewering is waar: muzikanten bij hofceremonies op gongs spelen."
      },
      {
        question: "Wat voor gerecht is ambuyat?",
        answer: "Een kleverige zetmeelgelei van de sagopalm",
        explanation: "Het antwoord is Een kleverige zetmeelgelei van de sagopalm; dit beantwoordt de vraag: Wat voor gerecht is ambuyat?"
      },
      {
        question: "Wie is het staatshoofd van Brunei?",
        answer: "De Sultan van Brunei",
        explanation: "Het antwoord is De Sultan van Brunei; dit beantwoordt de vraag: Wie is het staatshoofd van Brunei?"
      },
      {
        question: "Klopt het dat Brunei op het eiland Borneo ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Brunei op het eiland Borneo ligt."
      },
      {
        question: "Klopt het dat Brunei rijke olie- en gasvoorraden heeft?",
        answer: "Waar",
        explanation: "De bewering is waar: Brunei rijke olie- en gasvoorraden heeft."
      }
    ]
  },
  KHM: {
    name: "Cambodja",
    questions: [
      {
        question: "Klopt het dat het Khmer-alfabet heel veel letters heeft?",
        answer: "Waar",
        explanation: "De bewering is waar: het Khmer-alfabet heel veel letters heeft."
      },
      {
        question: "Klopt het dat men in Cambodja houten xylofoons (pinpeat) bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Cambodja houten xylofoons (pinpeat) bespeelt."
      },
      {
        question: "Wat voor gerecht is amok?",
        answer: "Viscurry gestoomd in bananenblad",
        explanation: "Het antwoord is Viscurry gestoomd in bananenblad; dit beantwoordt de vraag: Wat voor gerecht is amok?"
      },
      {
        question: "Klopt het dat de stroming van de rivier tijdens het Waterfestival omkeert?",
        answer: "Waar",
        explanation: "De bewering is waar: de stroming van de rivier tijdens het Waterfestival omkeert."
      },
      {
        question: "Hoe heet het reusachtige, oude tempelcomplex in Cambodja?",
        answer: "Angkor Wat",
        explanation: "Het antwoord is Angkor Wat; dit beantwoordt de vraag: Hoe heet het reusachtige, oude tempelcomplex in Cambodja?"
      },
      {
        question: "Klopt het dat er zoetwaterdolfijnen in de Mekong voorkomen?",
        answer: "Waar",
        explanation: "De bewering is waar: er zoetwaterdolfijnen in de Mekong voorkomen."
      }
    ]
  },
  PHL: {
    name: "Filipijnen",
    questions: [
      {
        question: "Klopt het dat Engels een officiële taal op de Filipijnen is?",
        answer: "Waar",
        explanation: "De bewering is waar: Engels een officiële taal op de Filipijnen is."
      },
      {
        question: "Klopt het dat de bevolking ontzettend van zingen en karaoke houdt?",
        answer: "Waar",
        explanation: "De bewering is waar: de bevolking ontzettend van zingen en karaoke houdt."
      },
      {
        question: "Wat voor gerecht is adobo?",
        answer: "Vlees gestoofd in ketjap, azijn en knoflook",
        explanation: "Het antwoord is Vlees gestoofd in ketjap, azijn en knoflook; dit beantwoordt de vraag: Wat voor gerecht is adobo?"
      },
      {
        question: "Klopt het dat men op de Filipijnen kleurrijke straatfestivals viert?",
        answer: "Waar",
        explanation: "De bewering is waar: men op de Filipijnen kleurrijke straatfestivals viert."
      },
      {
        question: "Uit hoeveel eilanden bestaan de Filipijnen ongeveer (70 of 7.000)?",
        answer: "Meer dan 7.000 eilanden",
        explanation: "Het antwoord is Meer dan 7.000 eilanden; dit beantwoordt de vraag: Uit hoeveel eilanden bestaan de Filipijnen ongeveer (70 of 7.000)?"
      },
      {
        question: "Klopt het dat de Filipijnen in de Stille Oceaan liggen?",
        answer: "Waar",
        explanation: "De bewering is waar: de Filipijnen in de Stille Oceaan liggen."
      }
    ]
  },
  IRQ: {
    name: "Irak",
    questions: [
      {
        question: "Klopt het dat men in Irak Arabisch en Koerdisch spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Irak Arabisch en Koerdisch spreekt."
      },
      {
        question: "Klopt het dat de maqam een traditionele, klassieke muziekstijl is?",
        answer: "Waar",
        explanation: "De bewering is waar: de maqam een traditionele, klassieke muziekstijl is."
      },
      {
        question: "Hoe heet de gegrilde karper van het open vuur?",
        answer: "Masgouf",
        explanation: "Het antwoord is Masgouf; dit beantwoordt de vraag: Hoe heet de gegrilde karper van het open vuur?"
      },
      {
        question: "Klopt het dat de eerste steden tussen twee rivieren in Irak zijn ontstaan?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: in Mesopotamië."
      },
      {
        question: "Welke twee beroemde rivieren stromen door Irak?",
        answer: "De Tigris en de Eufraat",
        explanation: "Het antwoord is De Tigris en de Eufraat; dit beantwoordt de vraag: Welke twee beroemde rivieren stromen door Irak?"
      },
      {
        question: "Wat is de hoofdstad van Irak?",
        answer: "Bagdad",
        explanation: "Het antwoord is Bagdad; dit beantwoordt de vraag: Wat is de hoofdstad van Irak?"
      }
    ]
  },
  IRN: {
    name: "Iran",
    questions: [
      {
        question: "Wat is de officiële taal van Iran?",
        answer: "Perzisch",
        explanation: "Het antwoord is Perzisch; aanvullende uitleg: Farsi."
      },
      {
        question: "Klopt het dat men het snaarinstrument santur bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men het snaarinstrument santur bespeelt."
      },
      {
        question: "Wat is Tahdig bij een rijstmaaltijd?",
        answer: "Het knapperige gebakken korstje onderin de pan",
        explanation: "Het antwoord is Het knapperige gebakken korstje onderin de pan; dit beantwoordt de vraag: Wat is Tahdig bij een rijstmaaltijd?"
      },
      {
        question: "Klopt het dat men in maart het lentefeest Nowruz viert?",
        answer: "Waar",
        explanation: "De bewering is waar: men in maart het lentefeest Nowruz viert."
      },
      {
        question: "Klopt het dat Iran ’s werelds grootste producent van saffraan is?",
        answer: "Waar",
        explanation: "De bewering is waar: Iran ’s werelds grootste producent van saffraan is."
      },
      {
        question: "Wat is de hoofdstad van Iran?",
        answer: "Teheran",
        explanation: "Het antwoord is Teheran; dit beantwoordt de vraag: Wat is de hoofdstad van Iran?"
      }
    ]
  },
  ISR: {
    name: "Israël",
    questions: [
      {
        question: "Klopt het dat het Hebreeuws van rechts naar links wordt geschreven?",
        answer: "Waar",
        explanation: "De bewering is waar: het Hebreeuws van rechts naar links wordt geschreven."
      },
      {
        question: "Klopt het dat klezmermuziek populair is bij feestelijke gelegenheden?",
        answer: "Waar",
        explanation: "De bewering is waar: klezmermuziek populair is bij feestelijke gelegenheden."
      },
      {
        question: "Van welke peulvrucht maakt men Falafel en Hummus?",
        answer: "Kikkererwten",
        explanation: "Het antwoord is Kikkererwten; dit beantwoordt de vraag: Van welke peulvrucht maakt men Falafel en Hummus?"
      },
      {
        question: "Op welke avond begint de wekelijkse rustdag Sabbat?",
        answer: "Vrijdagavond",
        explanation: "Het antwoord is Vrijdagavond; dit beantwoordt de vraag: Op welke avond begint de wekelijkse rustdag Sabbat?"
      },
      {
        question: "Waarom drijf je zo makkelijk in de Dode Zee?",
        answer: "Vanwege het extreem hoge zoutgehalte",
        explanation: "Het antwoord is Vanwege het extreem hoge zoutgehalte; dit beantwoordt de vraag: Waarom drijf je zo makkelijk in de Dode Zee?"
      },
      {
        question: "Klopt het dat Jeruzalem een heilige stad is?",
        answer: "Waar",
        explanation: "De bewering is waar: Jeruzalem een heilige stad is."
      }
    ]
  },
  YEM: {
    name: "Jemen",
    questions: [
      {
        question: "Wat is de officiële taal van Jemen?",
        answer: "Arabisch",
        explanation: "Het antwoord is Arabisch; dit beantwoordt de vraag: Wat is de officiële taal van Jemen?"
      },
      {
        question: "Klopt het dat zangers traditionele liederen begeleiden op de luit?",
        answer: "Waar",
        explanation: "De bewering is waar: zangers traditionele liederen begeleiden op de luit."
      },
      {
        question: "Klopt het dat men stoofpot eet die in een stenen schaal wordt opgediend?",
        answer: "Waar",
        explanation: "De bewering is waar: men stoofpot eet die in een stenen schaal wordt opgediend."
      },
      {
        question: "Klopt het dat veel mannen een gekromde dolk (janbiya) aan hun riem dragen?",
        answer: "Waar",
        explanation: "De bewering is waar: veel mannen een gekromde dolk (janbiya) aan hun riem dragen."
      },
      {
        question: "Hoe heet de unieke boom met rood sap op het eiland Socotra?",
        answer: "De drakenbloedboom",
        explanation: "Het antwoord is De drakenbloedboom; dit beantwoordt de vraag: Hoe heet de unieke boom met rood sap op het eiland Socotra?"
      },
      {
        question: "Klopt het dat Jemen op het Arabisch Schiereiland ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Jemen op het Arabisch Schiereiland ligt."
      }
    ]
  },
  JOR: {
    name: "Jordanië",
    questions: [
      {
        question: "Klopt het dat gastvrijheid centraal staat in de Jordaanse cultuur?",
        answer: "Waar",
        explanation: "De bewering is waar: gastvrijheid centraal staat in de Jordaanse cultuur."
      },
      {
        question: "Klopt het dat men de eensnarige viool rababa bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men de eensnarige viool rababa bespeelt."
      },
      {
        question: "Wat is Mansaf voor een feestgerecht?",
        answer: "Lamsvlees gegaard in gedroogde yoghurt met rijst",
        explanation: "Het antwoord is Lamsvlees gegaard in gedroogde yoghurt met rijst; dit beantwoordt de vraag: Wat is Mansaf voor een feestgerecht?"
      },
      {
        question: "Uit welk materiaal is de oude stad Petra gehakt?",
        answer: "Uit rode rotsen",
        explanation: "Het antwoord is Uit rode rotsen; dit beantwoordt de vraag: Uit welk materiaal is de oude stad Petra gehakt?"
      },
      {
        question: "Hoe heet de beroemde rode rotswoestijn in Jordanië?",
        answer: "Wadi Rum",
        explanation: "Het antwoord is Wadi Rum; dit beantwoordt de vraag: Hoe heet de beroemde rode rotswoestijn in Jordanië?"
      },
      {
        question: "Klopt het dat Jordanië aan de Dode Zee grenst?",
        answer: "Waar",
        explanation: "De bewering is waar: Jordanië aan de Dode Zee grenst."
      }
    ]
  },
  KAZ: {
    name: "Kazachstan",
    questions: [
      {
        question: "Klopt het dat er zowel Kazachs als Russisch wordt gesproken?",
        answer: "Waar",
        explanation: "De bewering is waar: er zowel Kazachs als Russisch wordt gesproken."
      },
      {
        question: "Wat voor instrument is de dombra?",
        answer: "Een tweesnarige langnekkige luit",
        explanation: "Het antwoord is Een tweesnarige langnekkige luit; dit beantwoordt de vraag: Wat voor instrument is de dombra?"
      },
      {
        question: "Wat voor gerecht is beshbarmak?",
        answer: "Gekookt vlees geserveerd op brede deegbladen",
        explanation: "Het antwoord is Gekookt vlees geserveerd op brede deegbladen; dit beantwoordt de vraag: Wat voor gerecht is beshbarmak?"
      },
      {
        question: "Met welke roofvogels jagen nomaden traditioneel op de steppe?",
        answer: "Steenarenden",
        explanation: "Het antwoord is Steenarenden; dit beantwoordt de vraag: Met welke roofvogels jagen nomaden traditioneel op de steppe?"
      },
      {
        question: "Klopt het dat Kazachstan voor een groot deel uit steppes bestaat?",
        answer: "Waar",
        explanation: "De bewering is waar: Kazachstan voor een groot deel uit steppes bestaat."
      },
      {
        question: "Klopt het dat Kazachstan het grootste ingesloten land ter wereld is?",
        answer: "Waar",
        explanation: "De bewering is waar: Kazachstan het grootste ingesloten land ter wereld is."
      }
    ]
  },
  KGZ: {
    name: "Kirgizië",
    questions: [
      {
        question: "Klopt het dat men in Kirgizië Kirgizisch spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Kirgizië Kirgizisch spreekt."
      },
      {
        question: "Klopt het dat men het houten tokkelinstrument komuz bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men het houten tokkelinstrument komuz bespeelt."
      },
      {
        question: "Van welk dier drinkt men gefermenteerde melk (koemis)?",
        answer: "Van een paard",
        explanation: "Het antwoord is Van een paard; aanvullende uitleg: merriemelk."
      },
      {
        question: "Hoe heten de ronde vilten tenten van de herders?",
        answer: "Jurten",
        explanation: "Het antwoord is Jurten; dit beantwoordt de vraag: Hoe heten de ronde vilten tenten van de herders?"
      },
      {
        question: "Klopt het dat het grote bergmeer Issyk-Kul in de winter bevriest?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: het bevriest nooit."
      },
      {
        question: "Klopt het dat Kirgizië voor het grootste deel uit hoge bergen bestaat?",
        answer: "Waar",
        explanation: "De bewering is waar: Kirgizië voor het grootste deel uit hoge bergen bestaat."
      }
    ]
  },
  KWT: {
    name: "Koeweit",
    questions: [
      {
        question: "Wat is de officiële taal van Koeweit?",
        answer: "Arabisch",
        explanation: "Het antwoord is Arabisch; dit beantwoordt de vraag: Wat is de officiële taal van Koeweit?"
      },
      {
        question: "Klopt het dat zeelieden zingen over parelduiken?",
        answer: "Waar",
        explanation: "De bewering is waar: zeelieden zingen over parelduiken."
      },
      {
        question: "Klopt het dat machboos gekruide rijst met kip of vis is?",
        answer: "Waar",
        explanation: "De bewering is waar: machboos gekruide rijst met kip of vis is."
      },
      {
        question: "Hoe heten de speciale ontmoetingsruimtes voor mannen?",
        answer: "Diwaniya",
        explanation: "Het antwoord is Diwaniya; dit beantwoordt de vraag: Hoe heten de speciale ontmoetingsruimtes voor mannen?"
      },
      {
        question: "Klopt het dat Koeweit aan de Perzische Golf ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Koeweit aan de Perzische Golf ligt."
      },
      {
        question: "Klopt het dat Koeweit grote aardolievoorraden heeft?",
        answer: "Waar",
        explanation: "De bewering is waar: Koeweit grote aardolievoorraden heeft."
      }
    ]
  },
  LAO: {
    name: "Laos",
    questions: [
      {
        question: "Klopt het dat men in Laos Laotiaans spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Laos Laotiaans spreekt."
      },
      {
        question: "Wat is het nationale instrument dat van bamboepijpen is gemaakt?",
        answer: "Het bamboemondorgel",
        explanation: "Het antwoord is Het bamboemondorgel; aanvullende uitleg: khene."
      },
      {
        question: "Hoe eet men de traditionele kleefrijst?",
        answer: "Met de handen",
        explanation: "Het antwoord is Met de handen; dit beantwoordt de vraag: Hoe eet men de traditionele kleefrijst?"
      },
      {
        question: "Welke kleur gewaden dragen boeddhistische monniken?",
        answer: "Oranje gewaden",
        explanation: "Het antwoord is Oranje gewaden; dit beantwoordt de vraag: Welke kleur gewaden dragen boeddhistische monniken?"
      },
      {
        question: "Welke grote rivier stroomt door Laos?",
        answer: "De Mekong-rivier",
        explanation: "Het antwoord is De Mekong-rivier; dit beantwoordt de vraag: Welke grote rivier stroomt door Laos?"
      },
      {
        question: "Klopt het dat Laos een eigen zeehaven aan de oceaan heeft?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: geheel ingesloten land."
      }
    ]
  },
  LBN: {
    name: "Libanon",
    questions: [
      {
        question: "Klopt het dat men in Libanon zowel Arabisch als Frans spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Libanon zowel Arabisch als Frans spreekt."
      },
      {
        question: "Hoe heet de bekende, meeslepende, traditionele rijdans?",
        answer: "Dabke",
        explanation: "Het antwoord is Dabke; dit beantwoordt de vraag: Hoe heet de bekende, meeslepende, traditionele rijdans?"
      },
      {
        question: "Hoe noemt men de verzameling kleine, heerlijke voorgerechtjes?",
        answer: "Meze",
        explanation: "Het antwoord is Meze; dit beantwoordt de vraag: Hoe noemt men de verzameling kleine, heerlijke voorgerechtjes?"
      },
      {
        question: "Welke boom staat afgebeeld op de nationale vlag?",
        answer: "De ceder",
        explanation: "Het antwoord is De ceder; aanvullende uitleg: Libanonceder."
      },
      {
        question: "Klopt het dat er eeuwenoude cederbomen in de bergen groeien?",
        answer: "Waar",
        explanation: "De bewering is waar: er eeuwenoude cederbomen in de bergen groeien."
      },
      {
        question: "Wat is de hoofdstad van Libanon?",
        answer: "Beiroet",
        explanation: "Het antwoord is Beiroet; dit beantwoordt de vraag: Wat is de hoofdstad van Libanon?"
      }
    ]
  },
  MDV: {
    name: "Malediven",
    questions: [
      {
        question: "Hoe heet de eigen taal van de Malediven?",
        answer: "Dhivehi",
        explanation: "Het antwoord is Dhivehi; dit beantwoordt de vraag: Hoe heet de eigen taal van de Malediven?"
      },
      {
        question: "Klopt het dat mensen op het strand dansen op trommelmuziek?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen op het strand dansen op trommelmuziek."
      },
      {
        question: "Welke twee ingrediënten vormen de basis van de lokale keuken?",
        answer: "Vis en kokosnoot",
        explanation: "Het antwoord is Vis en kokosnoot; dit beantwoordt de vraag: Welke twee ingrediënten vormen de basis van de lokale keuken?"
      },
      {
        question: "Bestaat de Malediven uit hoge bergen of lage koraaleilanden?",
        answer: "Lage koraaleilanden",
        explanation: "Het antwoord is Lage koraaleilanden; dit beantwoordt de vraag: Bestaat de Malediven uit hoge bergen of lage koraaleilanden?"
      },
      {
        question: "Klopt het dat je op de Malediven kunt zwemmen met grote walvishaaien?",
        answer: "Waar",
        explanation: "De bewering is waar: je op de Malediven kunt zwemmen met grote walvishaaien."
      },
      {
        question: "Wat is de hoofdstad van de Malediven?",
        answer: "Malé",
        explanation: "Het antwoord is Malé; dit beantwoordt de vraag: Wat is de hoofdstad van de Malediven?"
      }
    ]
  },
  MYS: {
    name: "Maleisië",
    questions: [
      {
        question: "Wat is de officiële taal in Maleisië?",
        answer: "Maleis",
        explanation: "Het antwoord is Maleis; dit beantwoordt de vraag: Wat is de officiële taal in Maleisië?"
      },
      {
        question: "Klopt het dat men in Maleisië van traditionele hofdans en -muziek houdt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Maleisië van traditionele hofdans en -muziek houdt."
      },
      {
        question: "Wat is nasi lemak?",
        answer: "Rijst gekookt in kokosmelk, geserveerd met pinda’s en ei",
        explanation: "Het antwoord is Rijst gekookt in kokosmelk, geserveerd met pinda’s en ei; dit beantwoordt de vraag: Wat is nasi lemak?"
      },
      {
        question: "Klopt het dat de bewoners elkaars religieuze feestdagen vieren?",
        answer: "Waar",
        explanation: "De bewering is waar: de bewoners elkaars religieuze feestdagen vieren."
      },
      {
        question: "Hoe heten de beroemde dubbele hoge torens in Kuala Lumpur?",
        answer: "De Petronas Towers",
        explanation: "Het antwoord is De Petronas Towers; dit beantwoordt de vraag: Hoe heten de beroemde dubbele hoge torens in Kuala Lumpur?"
      },
      {
        question: "Welke mensaap leeft in de bossen van Borneo?",
        answer: "De orang-oetan",
        explanation: "Het antwoord is De orang-oetan; dit beantwoordt de vraag: Welke mensaap leeft in de bossen van Borneo?"
      }
    ]
  },
  MNG: {
    name: "Mongolië",
    questions: [
      {
        question: "Klopt het dat men in Mongolië Mongools spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Mongolië Mongools spreekt."
      },
      {
        question: "Hoe noemt men de zangstijl waarbij twee tonen tegelijk klinken?",
        answer: "Keelzang",
        explanation: "Het antwoord is Keelzang; aanvullende uitleg: Khoomei."
      },
      {
        question: "Wat zijn buuz?",
        answer: "Gestoomde deegtasjes gevuld met schapenvlees",
        explanation: "Het antwoord is Gestoomde deegtasjes gevuld met schapenvlees; dit beantwoordt de vraag: Wat zijn buuz?"
      },
      {
        question: "In welke drie sporten strijdt men bij het Naadam-festival?",
        answer: "Worstelen, boogschieten en paardrijden",
        explanation: "Het antwoord is Worstelen, boogschieten en paardrijden; dit beantwoordt de vraag: In welke drie sporten strijdt men bij het Naadam-festival?"
      },
      {
        question: "Hoe heet de grote droge woestijn in het zuiden?",
        answer: "De Gobi-woestijn",
        explanation: "Het antwoord is De Gobi-woestijn; dit beantwoordt de vraag: Hoe heet de grote droge woestijn in het zuiden?"
      },
      {
        question: "Klopt het dat veel inwoners als nomadische herders leven?",
        answer: "Waar",
        explanation: "De bewering is waar: veel inwoners als nomadische herders leven."
      }
    ]
  },
  MMR: {
    name: "Myanmar (Birma)",
    questions: [
      {
        question: "Wat is de officiële taal van Myanmar?",
        answer: "Birmaans",
        explanation: "Het antwoord is Birmaans; dit beantwoordt de vraag: Wat is de officiële taal van Myanmar?"
      },
      {
        question: "Klopt het dat men de bootvormige harp saung-gauk bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men de bootvormige harp saung-gauk bespeelt."
      },
      {
        question: "Wat voor gerecht is mohinga?",
        answer: "Traditionele vissoep met rijstnoedels",
        explanation: "Het antwoord is Traditionele vissoep met rijstnoedels; dit beantwoordt de vraag: Wat voor gerecht is mohinga?"
      },
      {
        question: "Waarom smeren mensen thanakapasta op hun gezicht?",
        answer: "Als bescherming tegen de zon en als huidverzorging",
        explanation: "Het antwoord is Als bescherming tegen de zon en als huidverzorging; dit beantwoordt de vraag: Waarom smeren mensen thanakapasta op hun gezicht?"
      },
      {
        question: "Hoe roeien vissers op het Inlemeer hun boot?",
        answer: "Staand op één been, met het andere been om de roeispaan",
        explanation: "Het antwoord is Staand op één been, met het andere been om de roeispaan; dit beantwoordt de vraag: Hoe roeien vissers op het Inlemeer hun boot?"
      },
      {
        question: "Klopt het dat er duizenden oude tempels op de vlakte van Bagan staan?",
        answer: "Waar",
        explanation: "De bewering is waar: er duizenden oude tempels op de vlakte van Bagan staan."
      }
    ]
  },
  UZB: {
    name: "Oezbekistan",
    questions: [
      {
        question: "Klopt het dat men in Oezbekistan Oezbeeks spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Oezbekistan Oezbeeks spreekt."
      },
      {
        question: "Klopt het dat shashmaqam een traditionele, klassieke muziekstijl is?",
        answer: "Waar",
        explanation: "De bewering is waar: shashmaqam een traditionele, klassieke muziekstijl is."
      },
      {
        question: "Wat is het nationale rijstgerecht van Oezbekistan?",
        answer: "Plov",
        explanation: "Het antwoord is Plov; dit beantwoordt de vraag: Wat is het nationale rijstgerecht van Oezbekistan?"
      },
      {
        question: "Klopt het dat Oezbekistan op de historische handelsroute de Zijderoute lag?",
        answer: "Waar",
        explanation: "De bewering is waar: Oezbekistan op de historische handelsroute de Zijderoute lag."
      },
      {
        question: "Welke kleur mozaïekkoepels sieren steden als Samarkand?",
        answer: "Blauwe mozaïekkoepels",
        explanation: "Het antwoord is Blauwe mozaïekkoepels; dit beantwoordt de vraag: Welke kleur mozaïekkoepels sieren steden als Samarkand?"
      },
      {
        question: "Wat is de hoofdstad van Oezbekistan?",
        answer: "Tasjkent",
        explanation: "Het antwoord is Tasjkent; dit beantwoordt de vraag: Wat is de hoofdstad van Oezbekistan?"
      }
    ]
  },
  OMN: {
    name: "Oman",
    questions: [
      {
        question: "Wat is de officiële taal van het Sultanaat Oman?",
        answer: "Arabisch",
        explanation: "Het antwoord is Arabisch; dit beantwoordt de vraag: Wat is de officiële taal van het Sultanaat Oman?"
      },
      {
        question: "Klopt het dat mannen bij feesten zwaarddansen uitvoeren?",
        answer: "Waar",
        explanation: "De bewering is waar: mannen bij feesten zwaarddansen uitvoeren."
      },
      {
        question: "Hoe wordt het traditionele lamsvlees shuwa bereid?",
        answer: "Urenlang in een ondergrondse oven of kuil",
        explanation: "Het antwoord is Urenlang in een ondergrondse oven of kuil; dit beantwoordt de vraag: Hoe wordt het traditionele lamsvlees shuwa bereid?"
      },
      {
        question: "Welke geurige hars wordt in Oman uit bomen gewonnen?",
        answer: "Wierook",
        explanation: "Het antwoord is Wierook; dit beantwoordt de vraag: Welke geurige hars wordt in Oman uit bomen gewonnen?"
      },
      {
        question: "Welk zeldzaam wit dier leeft in de woestijn?",
        answer: "De Arabische Oryx",
        explanation: "Het antwoord is De Arabische Oryx; aanvullende uitleg: antilope."
      },
      {
        question: "Wat is de hoofdstad van Oman?",
        answer: "Muscat",
        explanation: "Het antwoord is Muscat; dit beantwoordt de vraag: Wat is de hoofdstad van Oman?"
      }
    ]
  },
  PAK: {
    name: "Pakistan",
    questions: [
      {
        question: "Klopt het dat Urdu en Engels de officiële talen van Pakistan zijn?",
        answer: "Waar",
        explanation: "De bewering is waar: Urdu en Engels de officiële talen van Pakistan zijn."
      },
      {
        question: "Hoe heet de meeslepende soefizang?",
        answer: "Qawwali",
        explanation: "Het antwoord is Qawwali; dit beantwoordt de vraag: Hoe heet de meeslepende soefizang?"
      },
      {
        question: "Wat voor feestelijk gerecht is biryani?",
        answer: "Gekruide gelaagde rijst met vlees",
        explanation: "Het antwoord is Gekruide gelaagde rijst met vlees; dit beantwoordt de vraag: Wat voor feestelijk gerecht is biryani?"
      },
      {
        question: "Wat laten mensen opstijgen tijdens het voorjaarsfeest Basant?",
        answer: "Duizenden gekleurde vliegers",
        explanation: "Het antwoord is Duizenden gekleurde vliegers; dit beantwoordt de vraag: Wat laten mensen opstijgen tijdens het voorjaarsfeest Basant?"
      },
      {
        question: "Hoe heet de op één na hoogste berg ter wereld, die in Pakistan ligt?",
        answer: "De K2",
        explanation: "Het antwoord is De K2; dit beantwoordt de vraag: Hoe heet de op één na hoogste berg ter wereld, die in Pakistan ligt?"
      },
      {
        question: "Wat is de hoofdstad van Pakistan?",
        answer: "Islamabad",
        explanation: "Het antwoord is Islamabad; dit beantwoordt de vraag: Wat is de hoofdstad van Pakistan?"
      }
    ]
  },
  PSE: {
    name: "Palestina",
    questions: [
      {
        question: "Welke taal spreekt men in de Palestijnse gebieden?",
        answer: "Arabisch",
        explanation: "Het antwoord is Arabisch; dit beantwoordt de vraag: Welke taal spreekt men in de Palestijnse gebieden?"
      },
      {
        question: "Klopt het dat mensen de vrolijke dabke-rijdans dansen?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen de vrolijke dabke-rijdans dansen."
      },
      {
        question: "Wat voor gerecht is musakhan?",
        answer: "Platbrood met gebraden kip, uien en sumak-kruiden",
        explanation: "Het antwoord is Platbrood met gebraden kip, uien en sumak-kruiden; dit beantwoordt de vraag: Wat voor gerecht is musakhan?"
      },
      {
        question: "Welke oogst brengt families in het najaar samen?",
        answer: "De olijvenoogst",
        explanation: "Het antwoord is De olijvenoogst; dit beantwoordt de vraag: Welke oogst brengt families in het najaar samen?"
      },
      {
        question: "Klopt het dat er veel olijfbomen in het landschap groeien?",
        answer: "Waar",
        explanation: "De bewering is waar: er veel olijfbomen in het landschap groeien."
      },
      {
        question: "In welke bekende stad staat de Geboortekerk?",
        answer: "Bethlehem",
        explanation: "Het antwoord is Bethlehem; dit beantwoordt de vraag: In welke bekende stad staat de Geboortekerk?"
      }
    ]
  },
  QAT: {
    name: "Qatar",
    questions: [
      {
        question: "Wat is de officiële taal van Qatar?",
        answer: "Arabisch",
        explanation: "Het antwoord is Arabisch; dit beantwoordt de vraag: Wat is de officiële taal van Qatar?"
      },
      {
        question: "Klopt het dat muzikanten aan de kust trommelmuziek maken?",
        answer: "Waar",
        explanation: "De bewering is waar: muzikanten aan de kust trommelmuziek maken."
      },
      {
        question: "Wat voor gerecht is machboos?",
        answer: "Gekruide rijst met vlees of vis",
        explanation: "Het antwoord is Gekruide rijst met vlees of vis; dit beantwoordt de vraag: Wat voor gerecht is machboos?"
      },
      {
        question: "Met welke roofvogels beoefent men een eeuwenoude jachttraditie?",
        answer: "Valken",
        explanation: "Het antwoord is Valken; aanvullende uitleg: de valkenjacht."
      },
      {
        question: "Klopt het dat Qatar op een schiereiland in de Perzische Golf ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Qatar op een schiereiland in de Perzische Golf ligt."
      },
      {
        question: "In welk jaar organiseerde Qatar het WK voetbal?",
        answer: "In 2022",
        explanation: "Het antwoord is In 2022; dit beantwoordt de vraag: In welk jaar organiseerde Qatar het WK voetbal?"
      }
    ]
  },
  SGP: {
    name: "Singapore",
    questions: [
      {
        question: "Klopt het dat Singapore meerdere officiële talen heeft?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: Engels, Mandarijn, Maleis, Tamil."
      },
      {
        question: "Klopt het dat jongeren in Singapore zowel moderne als traditionele popmuziek maken?",
        answer: "Waar",
        explanation: "De bewering is waar: jongeren in Singapore zowel moderne als traditionele popmuziek maken."
      },
      {
        question: "Hoe heten de overdekte eetmarkten met honderden kraampjes?",
        answer: "Hawker centres",
        explanation: "Het antwoord is Hawker centres; dit beantwoordt de vraag: Hoe heten de overdekte eetmarkten met honderden kraampjes?"
      },
      {
        question: "Klopt het dat Singapore bekendstaat om zijn schone en veilige straten?",
        answer: "Waar",
        explanation: "De bewering is waar: Singapore bekendstaat om zijn schone en veilige straten."
      },
      {
        question: "Hoe heten de reusachtige, kunstmatige bomen in de botanische tuin?",
        answer: "Supertrees",
        explanation: "Het antwoord is Supertrees; aanvullende uitleg: Gardens by the Bay."
      },
      {
        question: "Klopt het dat Singapore tegelijk een eiland, een stad en een land is?",
        answer: "Waar",
        explanation: "De bewering is waar: Singapore tegelijk een eiland, een stad en een land is."
      }
    ]
  },
  LKA: {
    name: "Sri Lanka",
    questions: [
      {
        question: "Welke twee talen worden gesproken op Sri Lanka?",
        answer: "Singalees en Tamil",
        explanation: "Het antwoord is Singalees en Tamil; dit beantwoordt de vraag: Welke twee talen worden gesproken op Sri Lanka?"
      },
      {
        question: "Klopt het dat men bij tempelfeesten traditionele trommels bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men bij tempelfeesten traditionele trommels bespeelt."
      },
      {
        question: "Wat voor gerecht is kottu roti?",
        answer: "Gehakt platbrood, geroerbakt met groenten en ei",
        explanation: "Het antwoord is Gehakt platbrood, geroerbakt met groenten en ei; dit beantwoordt de vraag: Wat voor gerecht is kottu roti?"
      },
      {
        question: "Welk groot dier loopt mee in versierde optochten?",
        answer: "De olifant",
        explanation: "Het antwoord is De olifant; dit beantwoordt de vraag: Welk groot dier loopt mee in versierde optochten?"
      },
      {
        question: "Hoe heet de beroemde, 200 meter hoge, historische rots?",
        answer: "Sigiriya",
        explanation: "Het antwoord is Sigiriya; aanvullende uitleg: Leeuwenrots."
      },
      {
        question: "Om welke wereldberoemde theesoort staat het eiland bekend?",
        answer: "Ceylon-thee",
        explanation: "Het antwoord is Ceylon-thee; dit beantwoordt de vraag: Om welke wereldberoemde theesoort staat het eiland bekend?"
      }
    ]
  },
  SYR: {
    name: "Syrië",
    questions: [
      {
        question: "Wat is de officiële taal van Syrië?",
        answer: "Arabisch",
        explanation: "Het antwoord is Arabisch; dit beantwoordt de vraag: Wat is de officiële taal van Syrië?"
      },
      {
        question: "Klopt het dat zangers traditionele, klassieke Arabische liederen zingen?",
        answer: "Waar",
        explanation: "De bewering is waar: zangers traditionele, klassieke Arabische liederen zingen."
      },
      {
        question: "Wat zijn kibbeh-deegballetjes?",
        answer: "Gefrituurde deegballetjes gevuld met gekruid gehakt",
        explanation: "Het antwoord is Gefrituurde deegballetjes gevuld met gekruid gehakt; dit beantwoordt de vraag: Wat zijn kibbeh-deegballetjes?"
      },
      {
        question: "Hoe noemt men de overdekte traditionele markten?",
        answer: "Souks",
        explanation: "Het antwoord is Souks; dit beantwoordt de vraag: Hoe noemt men de overdekte traditionele markten?"
      },
      {
        question: "Welke oude ruïnestad staat midden in de woestijn?",
        answer: "Palmyra",
        explanation: "Het antwoord is Palmyra; dit beantwoordt de vraag: Welke oude ruïnestad staat midden in de woestijn?"
      },
      {
        question: "Klopt het dat de hoofdstad Damascus een van de oudste bewoonde steden ter wereld is?",
        answer: "Waar",
        explanation: "De bewering is waar: de hoofdstad Damascus een van de oudste bewoonde steden ter wereld is."
      }
    ]
  },
  TJK: {
    name: "Tadzjikistan",
    questions: [
      {
        question: "Klopt het dat de taal van Tadzjikistan op het Perzisch lijkt?",
        answer: "Waar",
        explanation: "De bewering is waar: de taal van Tadzjikistan op het Perzisch lijkt."
      },
      {
        question: "Klopt het dat men van traditionele hofzang houdt?",
        answer: "Waar",
        explanation: "De bewering is waar: men van traditionele hofzang houdt."
      },
      {
        question: "Wat voor gerecht is qurutob?",
        answer: "Geweekt brood overgoten met een gedroogde kwarksaus",
        explanation: "Het antwoord is Geweekt brood overgoten met een gedroogde kwarksaus; dit beantwoordt de vraag: Wat voor gerecht is qurutob?"
      },
      {
        question: "Klopt het dat men in maart het lentefeest Navruz viert?",
        answer: "Waar",
        explanation: "De bewering is waar: men in maart het lentefeest Navruz viert."
      },
      {
        question: "Klopt het dat meer dan 90% van Tadzjikistan uit berggebied bestaat?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: het Pamir-gebergte."
      },
      {
        question: "Wat is de hoofdstad van Tadzjikistan?",
        answer: "Doesjanbe",
        explanation: "Het antwoord is Doesjanbe; dit beantwoordt de vraag: Wat is de hoofdstad van Tadzjikistan?"
      }
    ]
  },
  TLS: {
    name: "Timor-Leste (Oost-Timor)",
    questions: [
      {
        question: "Welke twee officiële talen heeft Oost-Timor?",
        answer: "Tetun en Portugees",
        explanation: "Het antwoord is Tetun en Portugees; dit beantwoordt de vraag: Welke twee officiële talen heeft Oost-Timor?"
      },
      {
        question: "Klopt het dat mensen in een kring dansen op trommelritmes?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen in een kring dansen op trommelritmes."
      },
      {
        question: "Wat vormen maïs en bonen in de lokale eetcultuur?",
        answer: "Het basisvoedsel",
        explanation: "Het antwoord is Het basisvoedsel; dit beantwoordt de vraag: Wat vormen maïs en bonen in de lokale eetcultuur?"
      },
      {
        question: "Hoe heten de met de hand geweven Oost-Timorese doeken?",
        answer: "Tais-doeken",
        explanation: "Het antwoord is Tais-doeken; dit beantwoordt de vraag: Hoe heten de met de hand geweven Oost-Timorese doeken?"
      },
      {
        question: "Klopt het dat Oost-Timor mooie koraalriffen heeft?",
        answer: "Waar",
        explanation: "De bewering is waar: Oost-Timor mooie koraalriffen heeft."
      },
      {
        question: "Klopt het dat het land in Zuidoost-Azië ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: het land in Zuidoost-Azië ligt."
      }
    ]
  },
  TKM: {
    name: "Turkmenistan",
    questions: [
      {
        question: "Wat is de officiële taal van Turkmenistan?",
        answer: "Turkmeens",
        explanation: "Het antwoord is Turkmeens; dit beantwoordt de vraag: Wat is de officiële taal van Turkmenistan?"
      },
      {
        question: "Klopt het dat men de langnekkige luit dutar bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men de langnekkige luit dutar bespeelt."
      },
      {
        question: "Klopt het dat men graag deeggerechten in vleesbouillon eet?",
        answer: "Waar",
        explanation: "De bewering is waar: men graag deeggerechten in vleesbouillon eet."
      },
      {
        question: "Welk prachtig, gouden paardenras wordt nationaal vereerd?",
        answer: "Het Akhal-Teke paard",
        explanation: "Het antwoord is Het Akhal-Teke paard; dit beantwoordt de vraag: Welk prachtig, gouden paardenras wordt nationaal vereerd?"
      },
      {
        question: "Hoe heet de brandende krater midden in de woestijn?",
        answer: "De ’Poort naar de Hel’",
        explanation: "Het antwoord is De ’Poort naar de Hel’; aanvullende uitleg: Darvaza."
      },
      {
        question: "Wat is de hoofdstad van Turkmenistan?",
        answer: "Ashgabat",
        explanation: "Het antwoord is Ashgabat; dit beantwoordt de vraag: Wat is de hoofdstad van Turkmenistan?"
      }
    ]
  },
  ARE: {
    name: "Verenigde Arabische Emiraten",
    questions: [
      {
        question: "Wat is de officiële taal van de VAE?",
        answer: "Arabisch",
        explanation: "Het antwoord is Arabisch; dit beantwoordt de vraag: Wat is de officiële taal van de VAE?"
      },
      {
        question: "Klopt het dat mannen bij feesten een stokkendans uitvoeren?",
        answer: "Waar",
        explanation: "De bewering is waar: mannen bij feesten een stokkendans uitvoeren."
      },
      {
        question: "Welk traditioneel graan- en vleesgerecht eet men bij feesten?",
        answer: "Harees",
        explanation: "Het antwoord is Harees; dit beantwoordt de vraag: Welk traditioneel graan- en vleesgerecht eet men bij feesten?"
      },
      {
        question: "Welke traditionele races worden gehouden in de woestijn?",
        answer: "Kamelenraces",
        explanation: "Het antwoord is Kamelenraces; dit beantwoordt de vraag: Welke traditionele races worden gehouden in de woestijn?"
      },
      {
        question: "Hoe heet de hoogste wolkenkrabber ter wereld, die in Dubai staat?",
        answer: "Burj Khalifa",
        explanation: "Het antwoord is Burj Khalifa; aanvullende uitleg: 828 meter."
      },
      {
        question: "Uit hoeveel emiraten bestaan de VAE (zoals Dubai en Abu Dhabi)?",
        answer: "7 emiraten",
        explanation: "Het antwoord is 7 emiraten; dit beantwoordt de vraag: Uit hoeveel emiraten bestaan de VAE (zoals Dubai en Abu Dhabi)?"
      }
    ]
  },
  PRK: {
    name: "Noord-Korea",
    questions: [
      {
        question: "Klopt het dat men in Noord-Korea Koreaans spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Noord-Korea Koreaans spreekt."
      },
      {
        question: "Klopt het dat duizenden mensen in stadions synchrone dansen opvoeren?",
        answer: "Waar",
        explanation: "De bewering is waar: duizenden mensen in stadions synchrone dansen opvoeren."
      },
      {
        question: "Welke noedels eet men traditioneel in ijskoud water?",
        answer: "Koude boekweitnoedels",
        explanation: "Het antwoord is Koude boekweitnoedels; aanvullende uitleg: Naengmyeon."
      },
      {
        question: "Klopt het dat mensen op feestdagen traditionele dracht of uniformen dragen?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen op feestdagen traditionele dracht of uniformen dragen."
      },
      {
        question: "Welke vulkanische berg geldt in de verhalen als heilig?",
        answer: "Berg Paektu",
        explanation: "Het antwoord is Berg Paektu; dit beantwoordt de vraag: Welke vulkanische berg geldt in de verhalen als heilig?"
      },
      {
        question: "Wat is de hoofdstad van Noord-Korea?",
        answer: "Pyongyang",
        explanation: "Het antwoord is Pyongyang; dit beantwoordt de vraag: Wat is de hoofdstad van Noord-Korea?"
      }
    ]
  },
  DZA: {
    name: "Algerije",
    questions: [
      {
        question: "Welke twee talen zijn officieel in Algerije?",
        answer: "Arabisch en Tamazight",
        explanation: "Het antwoord is Arabisch en Tamazight; aanvullende uitleg: Berbers."
      },
      {
        question: "Welke populaire dansmuziek ontstond in de havenstad Oran?",
        answer: "Raï-muziek",
        explanation: "Het antwoord is Raï-muziek; dit beantwoordt de vraag: Welke populaire dansmuziek ontstond in de havenstad Oran?"
      },
      {
        question: "Wat is het nationale gerecht van gestoomde tarwegries met groenten?",
        answer: "Couscous",
        explanation: "Het antwoord is Couscous; dit beantwoordt de vraag: Wat is het nationale gerecht van gestoomde tarwegries met groenten?"
      },
      {
        question: "Wanneer vieren de inheemse Berbers hun traditionele Nieuwjaar (Yennayer)?",
        answer: "In januari",
        explanation: "Het antwoord is In januari; dit beantwoordt de vraag: Wanneer vieren de inheemse Berbers hun traditionele Nieuwjaar (Yennayer)?"
      },
      {
        question: "Welke reusachtige zandwoestijn bedekt het grootste deel van het land?",
        answer: "De Sahara",
        explanation: "Het antwoord is De Sahara; dit beantwoordt de vraag: Welke reusachtige zandwoestijn bedekt het grootste deel van het land?"
      },
      {
        question: "Klopt het dat Algerije qua oppervlakte het grootste land van heel Afrika is?",
        answer: "Waar",
        explanation: "De bewering is waar: Algerije qua oppervlakte het grootste land van heel Afrika is."
      }
    ]
  },
  EGY: {
    name: "Egypte",
    questions: [
      {
        question: "Welk beeldschrift werd in het Oude Egypte gebruikt?",
        answer: "Hiërogliefen",
        explanation: "Het antwoord is Hiërogliefen; dit beantwoordt de vraag: Welk beeldschrift werd in het Oude Egypte gebruikt?"
      },
      {
        question: "Klopt het dat mensen in Egypte graag naar klassieke zangmuziek luisteren?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen in Egypte graag naar klassieke zangmuziek luisteren."
      },
      {
        question: "Wat zit er in het populaire straatgerecht Koshari?",
        answer: "Rijst, macaroni, linzen en pittige tomatensaus",
        explanation: "Het antwoord is Rijst, macaroni, linzen en pittige tomatensaus; dit beantwoordt de vraag: Wat zit er in het populaire straatgerecht Koshari?"
      },
      {
        question: "Hoe heet de traditionele lange jurk die veel mannen dragen?",
        answer: "Een galabeya",
        explanation: "Het antwoord is Een galabeya; dit beantwoordt de vraag: Hoe heet de traditionele lange jurk die veel mannen dragen?"
      },
      {
        question: "Welke machtige rivier stroomt door heel Egypte naar de zee?",
        answer: "De Nijl",
        explanation: "Het antwoord is De Nijl; dit beantwoordt de vraag: Welke machtige rivier stroomt door heel Egypte naar de zee?"
      },
      {
        question: "In welke stad staan de beroemde piramiden?",
        answer: "Gizeh",
        explanation: "Het antwoord is Gizeh; aanvullende uitleg: bij Caïro."
      }
    ]
  },
  MAR: {
    name: "Marokko",
    questions: [
      {
        question: "Klopt het dat er in Marokko naast Arabisch ook Berberse talen en Frans worden gesproken?",
        answer: "Waar",
        explanation: "De bewering is waar: er in Marokko naast Arabisch ook Berberse talen en Frans worden gesproken."
      },
      {
        question: "Met welk metalen percussie-instrument maken Gnawa-muzikanten ritme?",
        answer: "Krakebs",
        explanation: "Het antwoord is Krakebs; aanvullende uitleg: metalen castagnetten."
      },
      {
        question: "In wat voor aardewerken pan met puntdeksel kookt men langzame stoofschotels?",
        answer: "Een tajine",
        explanation: "Het antwoord is Een tajine; dit beantwoordt de vraag: In wat voor aardewerken pan met puntdeksel kookt men langzame stoofschotels?"
      },
      {
        question: "Welke warme zoete drank noemt men de ’Marokkaanse whisky’?",
        answer: "Munttee",
        explanation: "Het antwoord is Munttee; dit beantwoordt de vraag: Welke warme zoete drank noemt men de ’Marokkaanse whisky’?"
      },
      {
        question: "Welke bijnaam heeft de stad Chefchaouen vanwege haar blauwe straatjes?",
        answer: "De Blauwe Stad",
        explanation: "Het antwoord is De Blauwe Stad; dit beantwoordt de vraag: Welke bijnaam heeft de stad Chefchaouen vanwege haar blauwe straatjes?"
      },
      {
        question: "Klopt het dat Marokko dicht bij Europa ligt, aan de Straat van Gibraltar?",
        answer: "Waar",
        explanation: "De bewering is waar: Marokko dicht bij Europa ligt, aan de Straat van Gibraltar."
      }
    ]
  },
  KEN: {
    name: "Kenia",
    questions: [
      {
        question: "Wat betekent de bekende Swahili uitdrukking ’Hakuna Matata’?",
        answer: "Geen zorgen / Geen probleem",
        explanation: "Het antwoord is Geen zorgen / Geen probleem; dit beantwoordt de vraag: Wat betekent de bekende Swahili uitdrukking ’Hakuna Matata’?"
      },
      {
        question: "Klopt het dat muzikanten in Kenia op houten marimba’s en trommels spelen?",
        answer: "Waar",
        explanation: "De bewering is waar: muzikanten in Kenia op houten marimba’s en trommels spelen."
      },
      {
        question: "Wat is Ugali voor een gerecht?",
        answer: "Een stevige brij/pap van gekookt maïsmeel",
        explanation: "Het antwoord is Een stevige brij/pap van gekookt maïsmeel; dit beantwoordt de vraag: Wat is Ugali voor een gerecht?"
      },
      {
        question: "Welke stam staat bekend om zijn rode kleding en sprongdansen?",
        answer: "De Maasai",
        explanation: "Het antwoord is De Maasai; dit beantwoordt de vraag: Welke stam staat bekend om zijn rode kleding en sprongdansen?"
      },
      {
        question: "Hoe noemt men de jaarlijkse oversteek van miljoenen gnoes en zebra’s?",
        answer: "De Grote Migratie",
        explanation: "Het antwoord is De Grote Migratie; dit beantwoordt de vraag: Hoe noemt men de jaarlijkse oversteek van miljoenen gnoes en zebra’s?"
      },
      {
        question: "Welke vijf bekende wilde dieren noemt men samen de ’Big Five’?",
        answer: "Leeuw, olifant, buffel, neushoorn en luipaard",
        explanation: "Het antwoord is Leeuw, olifant, buffel, neushoorn en luipaard; dit beantwoordt de vraag: Welke vijf bekende wilde dieren noemt men samen de ’Big Five’?"
      }
    ]
  },
  ZAF: {
    name: "Zuid-Afrika",
    questions: [
      {
        question: "Hoeveel officiële talen heeft Zuid-Afrika in de grondwet staan?",
        answer: "11 officiële talen",
        explanation: "Het antwoord is 11 officiële talen; dit beantwoordt de vraag: Hoeveel officiële talen heeft Zuid-Afrika in de grondwet staan?"
      },
      {
        question: "Hoe heet de plastic blaastrompet, bekend van het WK voetbal van 2010?",
        answer: "De vuvuzela",
        explanation: "Het antwoord is De vuvuzela; dit beantwoordt de vraag: Hoe heet de plastic blaastrompet, bekend van het WK voetbal van 2010?"
      },
      {
        question: "Hoe noemen Zuid-Afrikanen hun gezellige barbecue op open vuur?",
        answer: "Een braai",
        explanation: "Het antwoord is Een braai; dit beantwoordt de vraag: Hoe noemen Zuid-Afrikanen hun gezellige barbecue op open vuur?"
      },
      {
        question: "Wie werd na 27 jaar celstraf de eerste zwarte president van Zuid-Afrika?",
        answer: "Nelson Mandela",
        explanation: "Het antwoord is Nelson Mandela; dit beantwoordt de vraag: Wie werd na 27 jaar celstraf de eerste zwarte president van Zuid-Afrika?"
      },
      {
        question: "Hoe heet de beroemde platte berg die uitkijkt over Kaapstad?",
        answer: "De Tafelberg",
        explanation: "Het antwoord is De Tafelberg; dit beantwoordt de vraag: Hoe heet de beroemde platte berg die uitkijkt over Kaapstad?"
      },
      {
        question: "In welk beroemd nationaal park kun je op safari om wilde dieren te spotten?",
        answer: "Het Kruger National Park",
        explanation: "Het antwoord is Het Kruger National Park; dit beantwoordt de vraag: In welk beroemd nationaal park kun je op safari om wilde dieren te spotten?"
      }
    ]
  },
  GHA: {
    name: "Ghana",
    questions: [
      {
        question: "Wat is de officiële taal van Ghana?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van Ghana?"
      },
      {
        question: "Klopt het dat men in Ghana de handtrommel djembé bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Ghana de handtrommel djembé bespeelt."
      },
      {
        question: "Wat is Jollof Rice voor een gerecht?",
        answer: "Gekruide rijst gekookt in een rijke tomatensaus",
        explanation: "Het antwoord is Gekruide rijst gekookt in een rijke tomatensaus; dit beantwoordt de vraag: Wat is Jollof Rice voor een gerecht?"
      },
      {
        question: "Hoe heet de traditionele, handgeweven, gekleurde stof?",
        answer: "Kente",
        explanation: "Het antwoord is Kente; dit beantwoordt de vraag: Hoe heet de traditionele, handgeweven, gekleurde stof?"
      },
      {
        question: "Van welk gewas is Ghana een van ’s werelds grootste exporteurs?",
        answer: "Cacaobonen",
        explanation: "Het antwoord is Cacaobonen; aanvullende uitleg: voor chocolade."
      },
      {
        question: "Wat is de hoofdstad van Ghana?",
        answer: "Accra",
        explanation: "Het antwoord is Accra; dit beantwoordt de vraag: Wat is de hoofdstad van Ghana?"
      }
    ]
  },
  ETH: {
    name: "Ethiopië",
    questions: [
      {
        question: "Klopt het dat Ethiopië een eigen, uniek schriftsysteem heeft (Ge’ez)?",
        answer: "Waar",
        explanation: "De bewering is waar: Ethiopië een eigen, uniek schriftsysteem heeft (Ge’ez)."
      },
      {
        question: "Klopt het dat de verhalenverteller de eensnarige viool masenqo bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: de verhalenverteller de eensnarige viool masenqo bespeelt."
      },
      {
        question: "Wat voor pannenkoek is injera?",
        answer: "Een zure, sponsachtige pannenkoek van teffmeel",
        explanation: "Het antwoord is Een zure, sponsachtige pannenkoek van teffmeel; dit beantwoordt de vraag: Wat voor pannenkoek is injera?"
      },
      {
        question: "Welke warme drank staat centraal in een uitgebreide ceremonie met wierook?",
        answer: "Koffie",
        explanation: "Het antwoord is Koffie; dit beantwoordt de vraag: Welke warme drank staat centraal in een uitgebreide ceremonie met wierook?"
      },
      {
        question: "Klopt het dat Ethiopië geldt als het oorsprongsland van de koffieplant?",
        answer: "Waar",
        explanation: "De bewering is waar: Ethiopië geldt als het oorsprongsland van de koffieplant."
      },
      {
        question: "Hoeveel maanden telt de traditionele Ethiopische kalender?",
        answer: "13 maanden",
        explanation: "Het antwoord is 13 maanden; dit beantwoordt de vraag: Hoeveel maanden telt de traditionele Ethiopische kalender?"
      }
    ]
  },
  MDG: {
    name: "Madagaskar",
    questions: [
      {
        question: "Welke taal spreekt men op het eiland Madagaskar?",
        answer: "Malagassisch",
        explanation: "Het antwoord is Malagassisch; aanvullende uitleg: en Frans."
      },
      {
        question: "Van welk natuurlijk materiaal is het instrument Valiha gemaakt?",
        answer: "Van een holle bamboebuis",
        explanation: "Het antwoord is Van een holle bamboebuis; dit beantwoordt de vraag: Van welk natuurlijk materiaal is het instrument Valiha gemaakt?"
      },
      {
        question: "Welk graanproduct staat bij vrijwel elke maaltijd op het menu?",
        answer: "Rijst",
        explanation: "Het antwoord is Rijst; dit beantwoordt de vraag: Welk graanproduct staat bij vrijwel elke maaltijd op het menu?"
      },
      {
        question: "Welk schattig halfaapje met gestreepte staart leeft op Madagaskar?",
        answer: "De ringstaartmaki",
        explanation: "Het antwoord is De ringstaartmaki; dit beantwoordt de vraag: Welk schattig halfaapje met gestreepte staart leeft op Madagaskar?"
      },
      {
        question: "Hoe heten de reusachtige, dikke bomen langs de beroemde Baobablaan?",
        answer: "Baobabs",
        explanation: "Het antwoord is Baobabs; dit beantwoordt de vraag: Hoe heten de reusachtige, dikke bomen langs de beroemde Baobablaan?"
      },
      {
        question: "In welke oceaan ligt het eiland Madagaskar?",
        answer: "De Indische Oceaan",
        explanation: "Het antwoord is De Indische Oceaan; dit beantwoordt de vraag: In welke oceaan ligt het eiland Madagaskar?"
      }
    ]
  },
  NGA: {
    name: "Nigeria",
    questions: [
      {
        question: "Wat is de officiële taal van Nigeria?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van Nigeria?"
      },
      {
        question: "Welk wereldwijd populair popmuziekgenre komt uit Nigeria?",
        answer: "Afrobeats",
        explanation: "Het antwoord is Afrobeats; dit beantwoordt de vraag: Welk wereldwijd populair popmuziekgenre komt uit Nigeria?"
      },
      {
        question: "Wat eet men traditioneel bij egusi-soep?",
        answer: "Gestampte yam",
        explanation: "Het antwoord is Gestampte yam; aanvullende uitleg: pounded yam."
      },
      {
        question: "Hoe noemt men de enorme filmindustrie van Nigeria?",
        answer: "Nollywood",
        explanation: "Het antwoord is Nollywood; dit beantwoordt de vraag: Hoe noemt men de enorme filmindustrie van Nigeria?"
      },
      {
        question: "Klopt het dat Nigeria het land met de meeste inwoners van heel Afrika is?",
        answer: "Waar",
        explanation: "De bewering is waar: Nigeria het land met de meeste inwoners van heel Afrika is."
      },
      {
        question: "Wat is de grote, bekende kuststad van Nigeria?",
        answer: "Lagos",
        explanation: "Het antwoord is Lagos; dit beantwoordt de vraag: Wat is de grote, bekende kuststad van Nigeria?"
      }
    ]
  },
  TZA: {
    name: "Tanzania",
    questions: [
      {
        question: "Wat is de nationale taal van Tanzania?",
        answer: "Swahili",
        explanation: "Het antwoord is Swahili; dit beantwoordt de vraag: Wat is de nationale taal van Tanzania?"
      },
      {
        question: "Klopt het dat de jeugd in Tanzania van de muziekstijl bongo flava houdt?",
        answer: "Waar",
        explanation: "De bewering is waar: de jeugd in Tanzania van de muziekstijl bongo flava houdt."
      },
      {
        question: "Wat is het belangrijkste maïsmeelgerecht van Tanzania?",
        answer: "Ugali",
        explanation: "Het antwoord is Ugali; dit beantwoordt de vraag: Wat is het belangrijkste maïsmeelgerecht van Tanzania?"
      },
      {
        question: "In welk beroemd wildpark vindt de grote dierentrek plaats?",
        answer: "Het Serengeti National Park",
        explanation: "Het antwoord is Het Serengeti National Park; dit beantwoordt de vraag: In welk beroemd wildpark vindt de grote dierentrek plaats?"
      },
      {
        question: "Hoe heet de hoogste berg van Afrika, die in Tanzania ligt?",
        answer: "De Kilimanjaro",
        explanation: "Het antwoord is De Kilimanjaro; aanvullende uitleg: 5.895 meter."
      },
      {
        question: "Welk exotisch kruideneiland hoort bij Tanzania?",
        answer: "Zanzibar",
        explanation: "Het antwoord is Zanzibar; dit beantwoordt de vraag: Welk exotisch kruideneiland hoort bij Tanzania?"
      }
    ]
  },
  AGO: {
    name: "Angola",
    questions: [
      {
        question: "Wat is de officiële taal van Angola?",
        answer: "Portugees",
        explanation: "Het antwoord is Portugees; dit beantwoordt de vraag: Wat is de officiële taal van Angola?"
      },
      {
        question: "Welke romantische dansstijl is in Angola ontstaan?",
        answer: "Kizomba",
        explanation: "Het antwoord is Kizomba; dit beantwoordt de vraag: Welke romantische dansstijl is in Angola ontstaan?"
      },
      {
        question: "Wat is Moamba de Galinha?",
        answer: "Kip gestoofd in een rijke palmoliesaus",
        explanation: "Het antwoord is Kip gestoofd in een rijke palmoliesaus; dit beantwoordt de vraag: Wat is Moamba de Galinha?"
      },
      {
        question: "Klopt het dat men in de hoofdstad straatcarnaval viert?",
        answer: "Waar",
        explanation: "De bewering is waar: men in de hoofdstad straatcarnaval viert."
      },
      {
        question: "Klopt het dat Angola indrukwekkende watervallen in het binnenland heeft?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: Kalandula watervallen."
      },
      {
        question: "Wat is de hoofdstad van Angola?",
        answer: "Luanda",
        explanation: "Het antwoord is Luanda; dit beantwoordt de vraag: Wat is de hoofdstad van Angola?"
      }
    ]
  },
  BEN: {
    name: "Benin",
    questions: [
      {
        question: "Wat is de officiële taal van Benin?",
        answer: "Frans",
        explanation: "Het antwoord is Frans; dit beantwoordt de vraag: Wat is de officiële taal van Benin?"
      },
      {
        question: "Klopt het dat ritmische trommels een rol spelen bij ceremonies?",
        answer: "Waar",
        explanation: "De bewering is waar: ritmische trommels een rol spelen bij ceremonies."
      },
      {
        question: "Klopt het dat men graag gefrituurde pindaknabbels eet?",
        answer: "Waar",
        explanation: "De bewering is waar: men graag gefrituurde pindaknabbels eet."
      },
      {
        question: "Van welke religie geldt Benin als de bakermat?",
        answer: "Voodoo",
        explanation: "Het antwoord is Voodoo; aanvullende uitleg: Vodun."
      },
      {
        question: "Hoe heet het beroemde vissersdorp dat geheel op palen in het meer staat?",
        answer: "Ganvié",
        explanation: "Het antwoord is Ganvié; dit beantwoordt de vraag: Hoe heet het beroemde vissersdorp dat geheel op palen in het meer staat?"
      },
      {
        question: "Klopt het dat Benin in West-Afrika ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Benin in West-Afrika ligt."
      }
    ]
  },
  BWA: {
    name: "Botswana",
    questions: [
      {
        question: "Klopt het dat men in Botswana Engels en Setswana spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Botswana Engels en Setswana spreekt."
      },
      {
        question: "Klopt het dat mensen dansen op traditionele stampritmes?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen dansen op traditionele stampritmes."
      },
      {
        question: "Wat is Seswaa voor een traditioneel gerecht?",
        answer: "Langzaam gegaard gepluisd rundvlees",
        explanation: "Het antwoord is Langzaam gegaard gepluisd rundvlees; dit beantwoordt de vraag: Wat is Seswaa voor een traditioneel gerecht?"
      },
      {
        question: "Hoe heet de traditionele dorpsbijeenkomst onder een boom?",
        answer: "Kgotla",
        explanation: "Het antwoord is Kgotla; dit beantwoordt de vraag: Hoe heet de traditionele dorpsbijeenkomst onder een boom?"
      },
      {
        question: "Hoe heet de unieke binnenlandse rivierdelta vol wilde dieren?",
        answer: "De Okavangodelta",
        explanation: "Het antwoord is De Okavangodelta; dit beantwoordt de vraag: Hoe heet de unieke binnenlandse rivierdelta vol wilde dieren?"
      },
      {
        question: "Klopt het dat er veel olifanten in Botswana voorkomen?",
        answer: "Waar",
        explanation: "De bewering is waar: er veel olifanten in Botswana voorkomen."
      }
    ]
  },
  BFA: {
    name: "Burkina Faso",
    questions: [
      {
        question: "Wat is de officiële taal van Burkina Faso?",
        answer: "Frans",
        explanation: "Het antwoord is Frans; dit beantwoordt de vraag: Wat is de officiële taal van Burkina Faso?"
      },
      {
        question: "Hoe heet de houten xylofoon met kalebassen eronder?",
        answer: "De balafon",
        explanation: "Het antwoord is De balafon; dit beantwoordt de vraag: Hoe heet de houten xylofoon met kalebassen eronder?"
      },
      {
        question: "Wat is Tô voor een gerecht?",
        answer: "Een stevige brij van gekookt gierst- of maïsmeel",
        explanation: "Het antwoord is Een stevige brij van gekookt gierst- of maïsmeel; dit beantwoordt de vraag: Wat is Tô voor een gerecht?"
      },
      {
        question: "Welk groot festival vindt plaats in de hoofdstad?",
        answer: "FESPACO",
        explanation: "Het antwoord is FESPACO; aanvullende uitleg: het grootste Afrikaanse filmfestival."
      },
      {
        question: "Wat betekent de naam Burkina Faso?",
        answer: "Land van de oprechte mensen",
        explanation: "Het antwoord is Land van de oprechte mensen; dit beantwoordt de vraag: Wat betekent de naam Burkina Faso?"
      },
      {
        question: "Wat is de hoofdstad van Burkina Faso?",
        answer: "Ouagadougou",
        explanation: "Het antwoord is Ouagadougou; dit beantwoordt de vraag: Wat is de hoofdstad van Burkina Faso?"
      }
    ]
  },
  BDI: {
    name: "Burundi",
    questions: [
      {
        question: "Klopt het dat de koninklijke trommelaars op grote houten trommels spelen?",
        answer: "Waar",
        explanation: "De bewering is waar: de koninklijke trommelaars op grote houten trommels spelen."
      },
      {
        question: "Klopt het dat mannen traditionele krijgersdansen uitvoeren?",
        answer: "Waar",
        explanation: "De bewering is waar: mannen traditionele krijgersdansen uitvoeren."
      },
      {
        question: "Klopt het dat men gegrilde vis uit het meer eet?",
        answer: "Waar",
        explanation: "De bewering is waar: men gegrilde vis uit het meer eet."
      },
      {
        question: "Aan welk groot en diep Afrikaans meer ligt Burundi?",
        answer: "Het Tanganyikameer",
        explanation: "Het antwoord is Het Tanganyikameer; dit beantwoordt de vraag: Aan welk groot en diep Afrikaans meer ligt Burundi?"
      },
      {
        question: "Klopt het dat het landschap uit groene heuvels bestaat?",
        answer: "Waar",
        explanation: "De bewering is waar: het landschap uit groene heuvels bestaat."
      },
      {
        question: "Wat is de hoofdstad van Burundi?",
        answer: "Gitega",
        explanation: "Het antwoord is Gitega; dit beantwoordt de vraag: Wat is de hoofdstad van Burundi?"
      }
    ]
  },
  CAF: {
    name: "Centraal-Afrikaanse Republiek",
    questions: [
      {
        question: "Welke taal spreekt men naast het Frans in de Centraal-Afrikaanse Republiek?",
        answer: "Sango",
        explanation: "Het antwoord is Sango; dit beantwoordt de vraag: Welke taal spreekt men naast het Frans in de Centraal-Afrikaanse Republiek?"
      },
      {
        question: "Klopt het dat de zang van de bospygmeeën op de UNESCO-lijst staat?",
        answer: "Waar",
        explanation: "De bewering is waar: de zang van de bospygmeeën op de UNESCO-lijst staat."
      },
      {
        question: "Klopt het dat men gehaktballen in cassavesaus eet?",
        answer: "Waar",
        explanation: "De bewering is waar: men gehaktballen in cassavesaus eet."
      },
      {
        question: "Hoe jagen bosbewoners traditioneel in het oerwoud?",
        answer: "Met gevlochten netten",
        explanation: "Het antwoord is Met gevlochten netten; dit beantwoordt de vraag: Hoe jagen bosbewoners traditioneel in het oerwoud?"
      },
      {
        question: "Klopt het dat een groot deel van het land met tropisch regenwoud is bedekt?",
        answer: "Niet waar",
        explanation: "De bewering is niet waar: een groot deel van het land met tropisch regenwoud is bedekt."
      },
      {
        question: "Welk zeldzaam dier leeft in deze bossen?",
        answer: "De bosolifant",
        explanation: "Het antwoord is De bosolifant; dit beantwoordt de vraag: Welk zeldzaam dier leeft in deze bossen?"
      }
    ]
  },
  COM: {
    name: "Comoren",
    questions: [
      {
        question: "Welke drie officiële talen kent de eilandengroep Comoren?",
        answer: "Comorisch, Frans en Arabisch",
        explanation: "Het antwoord is Comorisch, Frans en Arabisch; dit beantwoordt de vraag: Welke drie officiële talen kent de eilandengroep Comoren?"
      },
      {
        question: "Klopt het dat de lokale muziek Arabische en Afrikaanse invloeden combineert?",
        answer: "Waar",
        explanation: "De bewering is waar: de lokale muziek Arabische en Afrikaanse invloeden combineert."
      },
      {
        question: "Met welke dure specerij bereidt men graag vis op de eilanden?",
        answer: "Vanille",
        explanation: "Het antwoord is Vanille; dit beantwoordt de vraag: Met welke dure specerij bereidt men graag vis op de eilanden?"
      },
      {
        question: "Klopt het dat men een ’Groot Huwelijk’ viert dat meerdere dagen duurt?",
        answer: "Waar",
        explanation: "De bewering is waar: men een ’Groot Huwelijk’ viert dat meerdere dagen duurt."
      },
      {
        question: "Hoe heet de actieve vulkaan op het hoofdeiland?",
        answer: "Karthala",
        explanation: "Het antwoord is Karthala; dit beantwoordt de vraag: Hoe heet de actieve vulkaan op het hoofdeiland?"
      },
      {
        question: "Klopt het dat de Comoren een tropische eilandengroep zijn?",
        answer: "Waar",
        explanation: "De bewering is waar: de Comoren een tropische eilandengroep zijn."
      }
    ]
  },
  COG: {
    name: "Congo-Brazzaville",
    questions: [
      {
        question: "Wat is de officiële taal van Congo-Brazzaville?",
        answer: "Frans",
        explanation: "Het antwoord is Frans; dit beantwoordt de vraag: Wat is de officiële taal van Congo-Brazzaville?"
      },
      {
        question: "Klopt het dat Congolese rumba een populaire dansmuziek is?",
        answer: "Waar",
        explanation: "De bewering is waar: Congolese rumba een populaire dansmuziek is."
      },
      {
        question: "Wat is Saka-Saka voor een gerecht?",
        answer: "Gestoomde cassavebladeren bereid met pindapasta",
        explanation: "Het antwoord is Gestoomde cassavebladeren bereid met pindapasta; dit beantwoordt de vraag: Wat is Saka-Saka voor een gerecht?"
      },
      {
        question: "Hoe heet de subcultuur van mannen die extreem elegante pakken dragen?",
        answer: "De Sapeurs",
        explanation: "Het antwoord is De Sapeurs; aanvullende uitleg: La Sape."
      },
      {
        question: "Welke grote rivier stroomt langs de hoofdstad?",
        answer: "De Congo-rivier",
        explanation: "Het antwoord is De Congo-rivier; dit beantwoordt de vraag: Welke grote rivier stroomt langs de hoofdstad?"
      },
      {
        question: "Klopt het dat de laaglandgorilla in de beschermde bossen leeft?",
        answer: "Waar",
        explanation: "De bewering is waar: de laaglandgorilla in de beschermde bossen leeft."
      }
    ]
  },
  COD: {
    name: "Congo-Kinshasa (DRC)",
    questions: [
      {
        question: "Wat is de officiële taal van de Democratische Republiek Congo?",
        answer: "Frans",
        explanation: "Het antwoord is Frans; dit beantwoordt de vraag: Wat is de officiële taal van de Democratische Republiek Congo?"
      },
      {
        question: "Klopt het dat gitaarorkesten meeslepende rumbamuziek spelen?",
        answer: "Waar",
        explanation: "De bewering is waar: gitaarorkesten meeslepende rumbamuziek spelen."
      },
      {
        question: "Wat voor gerecht is poulet moambé?",
        answer: "Kip gekookt in een romige palmnotensaus",
        explanation: "Het antwoord is Kip gekookt in een romige palmnotensaus; dit beantwoordt de vraag: Wat voor gerecht is poulet moambé?"
      },
      {
        question: "Klopt het dat de modecultuur van de Sapeurs door de straten flaneert?",
        answer: "Waar",
        explanation: "De bewering is waar: de modecultuur van de Sapeurs door de straten flaneert."
      },
      {
        question: "Welk dier dat lijkt op een kruising tussen een zebra en een giraf leeft in de bossen?",
        answer: "De okapi",
        explanation: "Het antwoord is De okapi; dit beantwoordt de vraag: Welk dier dat lijkt op een kruising tussen een zebra en een giraf leeft in de bossen?"
      },
      {
        question: "Klopt het dat de DRC het op één na grootste regenwoud ter wereld heeft?",
        answer: "Waar",
        explanation: "De bewering is waar: de DRC het op één na grootste regenwoud ter wereld heeft."
      }
    ]
  },
  DJI: {
    name: "Djibouti",
    questions: [
      {
        question: "Welke twee talen worden gesproken in Djibouti?",
        answer: "Arabisch en Frans",
        explanation: "Het antwoord is Arabisch en Frans; dit beantwoordt de vraag: Welke twee talen worden gesproken in Djibouti?"
      },
      {
        question: "Klopt het dat nomaden traditionele woestijnliederen zingen?",
        answer: "Waar",
        explanation: "De bewering is waar: nomaden traditionele woestijnliederen zingen."
      },
      {
        question: "Klopt het dat men pittige lamsstoofpot met platbrood eet?",
        answer: "Niet waar",
        explanation: "De bewering is niet waar: men pittige lamsstoofpot met platbrood eet."
      },
      {
        question: "Welke geurige specerij zit er in de traditionele thee?",
        answer: "Kardemom",
        explanation: "Het antwoord is Kardemom; dit beantwoordt de vraag: Welke geurige specerij zit er in de traditionele thee?"
      },
      {
        question: "Hoe heet het extreem zoute meer dat het laagste punt van Afrika is?",
        answer: "Het Assalmeer",
        explanation: "Het antwoord is Het Assalmeer; dit beantwoordt de vraag: Hoe heet het extreem zoute meer dat het laagste punt van Afrika is?"
      },
      {
        question: "Klopt het dat je in Djibouti kunt zwemmen met walvishaaien?",
        answer: "Waar",
        explanation: "De bewering is waar: je in Djibouti kunt zwemmen met walvishaaien."
      }
    ]
  },
  GNQ: {
    name: "Equatoriaal-Guinea",
    questions: [
      {
        question: "Wat is de enige Spaanstalige landstaal in Afrika?",
        answer: "Spaans",
        explanation: "Het antwoord is Spaans; aanvullende uitleg: in Equatoriaal-Guinea."
      },
      {
        question: "Klopt het dat men bij verhalen een houten harpcither bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men bij verhalen een houten harpcither bespeelt."
      },
      {
        question: "Klopt het dat men vis eet die gekookt is in pikante pindasaus?",
        answer: "Waar",
        explanation: "De bewering is waar: men vis eet die gekookt is in pikante pindasaus."
      },
      {
        question: "Klopt het dat men maskerdansen uitvoert om het dorp te beschermen?",
        answer: "Niet waar",
        explanation: "De bewering is niet waar: men maskerdansen uitvoert om het dorp te beschermen."
      },
      {
        question: "Ligt de hoofdstad Malabo op een eiland of op het vasteland?",
        answer: "Op een tropisch eiland",
        explanation: "Het antwoord is Op een tropisch eiland; aanvullende uitleg: Bioko."
      },
      {
        question: "Klopt het dat het land in Midden-Afrika ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: het land in Midden-Afrika ligt."
      }
    ]
  },
  ERI: {
    name: "Eritrea",
    questions: [
      {
        question: "Wat is de meest gesproken taal in Eritrea?",
        answer: "Tigrinya",
        explanation: "Het antwoord is Tigrinya; dit beantwoordt de vraag: Wat is de meest gesproken taal in Eritrea?"
      },
      {
        question: "Klopt het dat men de houten lier krar bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men de houten lier krar bespeelt."
      },
      {
        question: "Op wat voor pannenkoek serveert men het eten?",
        answer: "Op een grote Injera pannenkoek",
        explanation: "Het antwoord is Op een grote Injera pannenkoek; dit beantwoordt de vraag: Op wat voor pannenkoek serveert men het eten?"
      },
      {
        question: "Klopt het dat het koffiebranden ter plekke gebeurt bij de koffieceremonie?",
        answer: "Waar",
        explanation: "De bewering is waar: het koffiebranden ter plekke gebeurt bij de koffieceremonie."
      },
      {
        question: "Aan welke warme zee ligt Eritrea?",
        answer: "De Rode Zee",
        explanation: "Het antwoord is De Rode Zee; dit beantwoordt de vraag: Aan welke warme zee ligt Eritrea?"
      },
      {
        question: "Om welke unieke architectuurstijl staat de hoofdstad Asmara bekend?",
        answer: "Art-Deco architectuur",
        explanation: "Het antwoord is Art-Deco architectuur; dit beantwoordt de vraag: Om welke unieke architectuurstijl staat de hoofdstad Asmara bekend?"
      }
    ]
  },
  SWZ: {
    name: "Eswatini (Swaziland)",
    questions: [
      {
        question: "Wat voor staatsvorm heeft het land Eswatini?",
        answer: "Een koninkrijk",
        explanation: "Het antwoord is Een koninkrijk; aanvullende uitleg: monarchie."
      },
      {
        question: "Klopt het dat mannen een stampdans met schilden en speren dansen?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: Sibhaca."
      },
      {
        question: "Klopt het dat men maïsmeelpap met zure melk eet?",
        answer: "Waar",
        explanation: "De bewering is waar: men maïsmeelpap met zure melk eet."
      },
      {
        question: "Hoe heet het festival waar duizenden jonge vrouwen dansen met riet?",
        answer: "Het rietdansfestival",
        explanation: "Het antwoord is Het rietdansfestival; aanvullende uitleg: Umhlanga."
      },
      {
        question: "Klopt het dat het land door een traditionele koning wordt geregeerd?",
        answer: "Waar",
        explanation: "De bewering is waar: het land door een traditionele koning wordt geregeerd."
      },
      {
        question: "Wat is de hoofdstad van Eswatini?",
        answer: "Mbabane",
        explanation: "Het antwoord is Mbabane; dit beantwoordt de vraag: Wat is de hoofdstad van Eswatini?"
      }
    ]
  },
  GAB: {
    name: "Gabon",
    questions: [
      {
        question: "Wat is de officiële taal van Gabon?",
        answer: "Frans",
        explanation: "Het antwoord is Frans; dit beantwoordt de vraag: Wat is de officiële taal van Gabon?"
      },
      {
        question: "Klopt het dat men bij rituelen een heilige harp bespeelt?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: Bwiti ritueel."
      },
      {
        question: "Wat is Poulet Nyembwe voor een gerecht?",
        answer: "Kip gekookt in gestampte palmnoten",
        explanation: "Het antwoord is Kip gekookt in gestampte palmnoten; dit beantwoordt de vraag: Wat is Poulet Nyembwe voor een gerecht?"
      },
      {
        question: "Welke medicinale plant wordt gebruikt bij initiaties?",
        answer: "Iboga",
        explanation: "Het antwoord is Iboga; dit beantwoordt de vraag: Welke medicinale plant wordt gebruikt bij initiaties?"
      },
      {
        question: "Welke grote zoogdieren kun je in de zee zien ’surfen’ op de golven?",
        answer: "Nijlpaarden",
        explanation: "Het antwoord is Nijlpaarden; dit beantwoordt de vraag: Welke grote zoogdieren kun je in de zee zien ’surfen’ op de golven?"
      },
      {
        question: "Klopt het dat meer dan 80% van Gabon met regenwoud is bedekt?",
        answer: "Waar",
        explanation: "De bewering is waar: meer dan 80% van Gabon met regenwoud is bedekt."
      }
    ]
  },
  GMB: {
    name: "Gambia",
    questions: [
      {
        question: "Wat is de officiële taal van Gambia?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van Gambia?"
      },
      {
        question: "Hoe heet de grote kalebasharp van de verhalenverteller?",
        answer: "De kora",
        explanation: "Het antwoord is De kora; dit beantwoordt de vraag: Hoe heet de grote kalebasharp van de verhalenverteller?"
      },
      {
        question: "Wat is Domoda voor een gerecht?",
        answer: "Een rijke pinda-stoofpot geserveerd met rijst",
        explanation: "Het antwoord is Een rijke pinda-stoofpot geserveerd met rijst; dit beantwoordt de vraag: Wat is Domoda voor een gerecht?"
      },
      {
        question: "Hoe noemt men de traditionele rondtrekkende zangers en dichters?",
        answer: "Griots",
        explanation: "Het antwoord is Griots; dit beantwoordt de vraag: Hoe noemt men de traditionele rondtrekkende zangers en dichters?"
      },
      {
        question: "Klopt het dat Gambia het kleinste land op het vasteland van Afrika is?",
        answer: "Waar",
        explanation: "De bewering is waar: Gambia het kleinste land op het vasteland van Afrika is."
      },
      {
        question: "Welke rivier stroomt dwars door het hele land?",
        answer: "De Gambia-rivier",
        explanation: "Het antwoord is De Gambia-rivier; dit beantwoordt de vraag: Welke rivier stroomt dwars door het hele land?"
      }
    ]
  },
  GIN: {
    name: "Guinee",
    questions: [
      {
        question: "Wat is de officiële taal van Guinee?",
        answer: "Frans",
        explanation: "Het antwoord is Frans; dit beantwoordt de vraag: Wat is de officiële taal van Guinee?"
      },
      {
        question: "Van welk bekend percussie-instrument geldt Guinee als bakermat?",
        answer: "De djembé",
        explanation: "Het antwoord is De djembé; dit beantwoordt de vraag: Van welk bekend percussie-instrument geldt Guinee als bakermat?"
      },
      {
        question: "Wat is poulet yassa voor een gerecht?",
        answer: "Kip bereid met veel gefruite uien, citroen en mosterd",
        explanation: "Het antwoord is Kip bereid met veel gefruite uien, citroen en mosterd; dit beantwoordt de vraag: Wat is poulet yassa voor een gerecht?"
      },
      {
        question: "Klopt het dat Guinee vroeger bij het oude Mali-rijk hoorde?",
        answer: "Waar",
        explanation: "De bewering is waar: Guinee vroeger bij het oude Mali-rijk hoorde."
      },
      {
        question: "Waarom noemt men het bergland de ’watertoren’ van West-Afrika?",
        answer: "Omdat er grote rivieren ontspringen",
        explanation: "Onder meer de Niger ontspringt in dit bergland."
      },
      {
        question: "Wat is de hoofdstad van Guinee?",
        answer: "Conakry",
        explanation: "Het antwoord is Conakry; dit beantwoordt de vraag: Wat is de hoofdstad van Guinee?"
      }
    ]
  },
  GNB: {
    name: "Guinee-Bissau",
    questions: [
      {
        question: "Wat is de officiële taal van Guinee-Bissau?",
        answer: "Portugees",
        explanation: "Het antwoord is Portugees; dit beantwoordt de vraag: Wat is de officiële taal van Guinee-Bissau?"
      },
      {
        question: "Klopt het dat gumbé-muziek de nationale trommelmuziek is?",
        answer: "Waar",
        explanation: "De bewering is waar: gumbé-muziek de nationale trommelmuziek is."
      },
      {
        question: "Wat is Caldo de Mancarra?",
        answer: "Een traditionele pindasoep geserveerd met rijst",
        explanation: "Het antwoord is Een traditionele pindasoep geserveerd met rijst; dit beantwoordt de vraag: Wat is Caldo de Mancarra?"
      },
      {
        question: "Klopt het dat men een kleurrijk carnaval in de straten viert?",
        answer: "Waar",
        explanation: "De bewering is waar: men een kleurrijk carnaval in de straten viert."
      },
      {
        question: "Hoe heet de prachtige tropische eilandengroep voor de kust?",
        answer: "De Bijagós-archipel",
        explanation: "Het antwoord is De Bijagós-archipel; dit beantwoordt de vraag: Hoe heet de prachtige tropische eilandengroep voor de kust?"
      },
      {
        question: "Klopt het dat er nijlpaarden in het zoute zeewater bij de eilanden zwemmen?",
        answer: "Waar",
        explanation: "De bewering is waar: er nijlpaarden in het zoute zeewater bij de eilanden zwemmen."
      }
    ]
  },
  CIV: {
    name: "Ivoorkust",
    questions: [
      {
        question: "Wat is de officiële taal van Ivoorkust?",
        answer: "Frans",
        explanation: "Het antwoord is Frans; dit beantwoordt de vraag: Wat is de officiële taal van Ivoorkust?"
      },
      {
        question: "Welke energieke feestmuziek en dansstijl is hier ontstaan?",
        answer: "Coupé-Décalé",
        explanation: "Het antwoord is Coupé-Décalé; dit beantwoordt de vraag: Welke energieke feestmuziek en dansstijl is hier ontstaan?"
      },
      {
        question: "Wat voor bijgerecht is attiéké?",
        answer: "Gestoomde, geraspte, gefermenteerde cassave",
        explanation: "Het antwoord is Gestoomde, geraspte, gefermenteerde cassave; dit beantwoordt de vraag: Wat voor bijgerecht is attiéké?"
      },
      {
        question: "Klopt het dat dansers houten maskers dragen bij traditionele rituelen?",
        answer: "Waar",
        explanation: "De bewering is waar: dansers houten maskers dragen bij traditionele rituelen."
      },
      {
        question: "Van welk ingrediënt voor chocolade is Ivoorkust ’s werelds grootste producent?",
        answer: "Cacaobonen",
        explanation: "Het antwoord is Cacaobonen; dit beantwoordt de vraag: Van welk ingrediënt voor chocolade is Ivoorkust ’s werelds grootste producent?"
      },
      {
        question: "Wat is de officiële hoofdstad met de reusachtige basiliek?",
        answer: "Yamoussoukro",
        explanation: "Het antwoord is Yamoussoukro; dit beantwoordt de vraag: Wat is de officiële hoofdstad met de reusachtige basiliek?"
      }
    ]
  },
  CPV: {
    name: "Kaapverdië",
    questions: [
      {
        question: "Welke twee talen spreekt men op de Kaapverdische eilanden?",
        answer: "Portugees en Kaapverdisch Creools",
        explanation: "Het antwoord is Portugees en Kaapverdisch Creools; dit beantwoordt de vraag: Welke twee talen spreekt men op de Kaapverdische eilanden?"
      },
      {
        question: "Hoe heet de melancholische zangstijl bekend door Cesária Évora?",
        answer: "Morna",
        explanation: "Het antwoord is Morna; dit beantwoordt de vraag: Hoe heet de melancholische zangstijl bekend door Cesária Évora?"
      },
      {
        question: "Wat voor gerecht is cachupa?",
        answer: "Een rijk stoofgerecht van maïs, bonen en vlees of vis",
        explanation: "Het antwoord is Een rijk stoofgerecht van maïs, bonen en vlees of vis; dit beantwoordt de vraag: Wat voor gerecht is cachupa?"
      },
      {
        question: "Op welk eiland viert men een bruisend straatcarnaval?",
        answer: "São Vicente",
        explanation: "Het antwoord is São Vicente; dit beantwoordt de vraag: Op welk eiland viert men een bruisend straatcarnaval?"
      },
      {
        question: "Hoe heet de hoge zwarte vulkaan op het eiland Fogo?",
        answer: "Pico do Fogo",
        explanation: "Het antwoord is Pico do Fogo; dit beantwoordt de vraag: Hoe heet de hoge zwarte vulkaan op het eiland Fogo?"
      },
      {
        question: "Klopt het dat de eilanden vulkanisch van oorsprong zijn?",
        answer: "Waar",
        explanation: "De bewering is waar: de eilanden vulkanisch van oorsprong zijn."
      }
    ]
  },
  CMR: {
    name: "Kameroen",
    questions: [
      {
        question: "Welke twee Europese talen zijn officieel in Kameroen?",
        answer: "Frans en Engels",
        explanation: "Het antwoord is Frans en Engels; dit beantwoordt de vraag: Welke twee Europese talen zijn officieel in Kameroen?"
      },
      {
        question: "Welke populaire dansmuziekstijl werd beroemd door Manu Dibango?",
        answer: "Makossa",
        explanation: "Het antwoord is Makossa; dit beantwoordt de vraag: Welke populaire dansmuziekstijl werd beroemd door Manu Dibango?"
      },
      {
        question: "Wat voor nationaal gerecht is ndolé?",
        answer: "Een stoofpot van bitterbladeren, pinda’s en garnalen of vlees",
        explanation: "Het antwoord is Een stoofpot van bitterbladeren, pinda’s en garnalen of vlees; dit beantwoordt de vraag: Wat voor nationaal gerecht is ndolé?"
      },
      {
        question: "Klopt het dat men een waterfestival viert om de riviergoden te eren?",
        answer: "Waar",
        explanation: "De bewering is waar: men een waterfestival viert om de riviergoden te eren."
      },
      {
        question: "Hoe heet de hoogste actieve vulkaan van West-Afrika?",
        answer: "Mount Cameroon",
        explanation: "Het antwoord is Mount Cameroon; aanvullende uitleg: 4.040 meter."
      },
      {
        question: "Waarom noemt men Kameroen ’Afrika in het klein’?",
        answer: "Vanwege de enorme variatie in landschappen en culturen",
        explanation: "Het antwoord is Vanwege de enorme variatie in landschappen en culturen; dit beantwoordt de vraag: Waarom noemt men Kameroen ’Afrika in het klein’?"
      }
    ]
  },
  LSO: {
    name: "Lesotho",
    questions: [
      {
        question: "Wat voor staatsvorm heeft het bergland Lesotho?",
        answer: "Een koninkrijk",
        explanation: "Het antwoord is Een koninkrijk; aanvullende uitleg: monarchie."
      },
      {
        question: "Naar welk instrument luistert men graag in de famomuziek?",
        answer: "De accordeon",
        explanation: "Het antwoord is De accordeon; dit beantwoordt de vraag: Naar welk instrument luistert men graag in de famomuziek?"
      },
      {
        question: "Wat is Papa voor een gerecht?",
        answer: "Een stevige maïsmeel-pap geserveerd met groenten",
        explanation: "Het antwoord is Een stevige maïsmeel-pap geserveerd met groenten; dit beantwoordt de vraag: Wat is Papa voor een gerecht?"
      },
      {
        question: "Hoe heet de traditionele, spitse, strooien hoed van Lesotho?",
        answer: "De mokorotlo",
        explanation: "Het antwoord is De mokorotlo; dit beantwoordt de vraag: Hoe heet de traditionele, spitse, strooien hoed van Lesotho?"
      },
      {
        question: "Klopt het dat het hele land hoger dan 1.000 meter boven de zeespiegel ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: het hele land hoger dan 1.000 meter boven de zeespiegel ligt."
      },
      {
        question: "Door welk land wordt Lesotho aan alle kanten omsloten?",
        answer: "Zuid-Afrika",
        explanation: "Het antwoord is Zuid-Afrika; dit beantwoordt de vraag: Door welk land wordt Lesotho aan alle kanten omsloten?"
      }
    ]
  },
  LBR: {
    name: "Liberia",
    questions: [
      {
        question: "Wat is de officiële taal van Liberia?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van Liberia?"
      },
      {
        question: "Klopt het dat jongeren graag luisteren naar de lokale hiphopstijl hipco?",
        answer: "Waar",
        explanation: "De bewering is waar: jongeren graag luisteren naar de lokale hiphopstijl hipco."
      },
      {
        question: "Wat is Dumboy voor een gerecht?",
        answer: "Gestampte cassave-ballen geserveerd in een scherpe soep",
        explanation: "Het antwoord is Gestampte cassave-ballen geserveerd in een scherpe soep; dit beantwoordt de vraag: Wat is Dumboy voor een gerecht?"
      },
      {
        question: "Door wie werd Liberia in de 19e eeuw gesticht?",
        answer: "Door vrijgemaakte Amerikaanse slaven",
        explanation: "Het antwoord is Door vrijgemaakte Amerikaanse slaven; dit beantwoordt de vraag: Door wie werd Liberia in de 19e eeuw gesticht?"
      },
      {
        question: "Welk zeldzaam, schuw zoogdier leeft in de dichte bossen?",
        answer: "Het dwergnijlpaard",
        explanation: "Het antwoord is Het dwergnijlpaard; dit beantwoordt de vraag: Welk zeldzaam, schuw zoogdier leeft in de dichte bossen?"
      },
      {
        question: "Wat is de hoofdstad van Liberia?",
        answer: "Monrovia",
        explanation: "Het antwoord is Monrovia; dit beantwoordt de vraag: Wat is de hoofdstad van Liberia?"
      }
    ]
  },
  LBY: {
    name: "Libië",
    questions: [
      {
        question: "Wat is de officiële taal van Libië?",
        answer: "Arabisch",
        explanation: "Het antwoord is Arabisch; dit beantwoordt de vraag: Wat is de officiële taal van Libië?"
      },
      {
        question: "Klopt het dat muzikanten in de woestijn op fluiten en trommels spelen?",
        answer: "Waar",
        explanation: "De bewering is waar: muzikanten in de woestijn op fluiten en trommels spelen."
      },
      {
        question: "Wat voor traditioneel gerecht is bazeen?",
        answer: "Een stevige gerstedeegbal opgediend met vleessaus",
        explanation: "Het antwoord is Een stevige gerstedeegbal opgediend met vleessaus; dit beantwoordt de vraag: Wat voor traditioneel gerecht is bazeen?"
      },
      {
        question: "Hoeveel glaasjes thee schenkt men traditioneel achter elkaar in?",
        answer: "3 glaasjes thee",
        explanation: "Het antwoord is 3 glaasjes thee; dit beantwoordt de vraag: Hoeveel glaasjes thee schenkt men traditioneel achter elkaar in?"
      },
      {
        question: "Welke grote woestijn bedekt het grootste deel van het land?",
        answer: "De Sahara-woestijn",
        explanation: "Het antwoord is De Sahara-woestijn; dit beantwoordt de vraag: Welke grote woestijn bedekt het grootste deel van het land?"
      },
      {
        question: "Hoe heten de indrukwekkende Romeinse ruïnes aan de kust?",
        answer: "Leptis Magna",
        explanation: "Het antwoord is Leptis Magna; dit beantwoordt de vraag: Hoe heten de indrukwekkende Romeinse ruïnes aan de kust?"
      }
    ]
  },
  MWI: {
    name: "Malawi",
    questions: [
      {
        question: "Welke twee talen zijn officieel in Malawi?",
        answer: "Engels en Chichewa",
        explanation: "Het antwoord is Engels en Chichewa; dit beantwoordt de vraag: Welke twee talen zijn officieel in Malawi?"
      },
      {
        question: "Klopt het dat gemaskerde mannen van het Gule Wamkulu-genootschap dansen?",
        answer: "Waar",
        explanation: "De bewering is waar: gemaskerde mannen van het Gule Wamkulu-genootschap dansen."
      },
      {
        question: "Wat voor gerecht is nsima?",
        answer: "Een dikke maïsmeel-pap gegeten met vis of vlees",
        explanation: "Het antwoord is Een dikke maïsmeel-pap gegeten met vis of vlees; dit beantwoordt de vraag: Wat voor gerecht is nsima?"
      },
      {
        question: "Welke bijnaam heeft Malawi vanwege haar gastvrije bevolking?",
        answer: "Het Warme Hart van Afrika",
        explanation: "Het antwoord is Het Warme Hart van Afrika; dit beantwoordt de vraag: Welke bijnaam heeft Malawi vanwege haar gastvrije bevolking?"
      },
      {
        question: "Welk deel van het land wordt ingenomen door het Malawimeer?",
        answer: "Ongeveer een vijfde van het landoppervlak",
        explanation: "Een vijfde komt overeen met ongeveer 20%."
      },
      {
        question: "Klopt het dat er veel kleurrijke cichliden in het meer leven?",
        answer: "Waar",
        explanation: "De bewering is waar: er veel kleurrijke cichliden in het meer leven."
      }
    ]
  },
  MLI: {
    name: "Mali",
    questions: [
      {
        question: "Wat is de officiële taal van Mali?",
        answer: "Frans",
        explanation: "Het antwoord is Frans; dit beantwoordt de vraag: Wat is de officiële taal van Mali?"
      },
      {
        question: "Welke gitaar-muziekstijl uit Mali werd wereldberoemd?",
        answer: "Woestijnblues",
        explanation: "Het antwoord is Woestijnblues; aanvullende uitleg: Desert Blues."
      },
      {
        question: "Wat voor gerecht is tigadèguèna?",
        answer: "Een heerlijke pindasaus-stoofpot geserveerd met rijst",
        explanation: "Het antwoord is Een heerlijke pindasaus-stoofpot geserveerd met rijst; dit beantwoordt de vraag: Wat voor gerecht is tigadèguèna?"
      },
      {
        question: "Op wat voor hulpmiddelen dansen de gemaskerde Dogon-dansers?",
        answer: "Op hoge houten stelten",
        explanation: "Het antwoord is Op hoge houten stelten; dit beantwoordt de vraag: Op wat voor hulpmiddelen dansen de gemaskerde Dogon-dansers?"
      },
      {
        question: "Waarom is de Grote Moskee van Djenné zo bijzonder?",
        answer: "Het is het grootste lemen bouwwerk ter wereld",
        explanation: "Het antwoord is Het is het grootste lemen bouwwerk ter wereld; dit beantwoordt de vraag: Waarom is de Grote Moskee van Djenné zo bijzonder?"
      },
      {
        question: "Welke legendarische historische handelsstad ligt in Mali?",
        answer: "Timbuktu",
        explanation: "Het antwoord is Timbuktu; dit beantwoordt de vraag: Welke legendarische historische handelsstad ligt in Mali?"
      }
    ]
  },
  MRT: {
    name: "Mauritanië",
    questions: [
      {
        question: "Wat is de officiële taal van Mauritanië?",
        answer: "Arabisch",
        explanation: "Het antwoord is Arabisch; dit beantwoordt de vraag: Wat is de officiële taal van Mauritanië?"
      },
      {
        question: "Hoe heet de traditionele, hoekige, houten harp die door vrouwen wordt bespeeld?",
        answer: "De ardin",
        explanation: "Het antwoord is De ardin; dit beantwoordt de vraag: Hoe heet de traditionele, hoekige, houten harp die door vrouwen wordt bespeeld?"
      },
      {
        question: "Klopt het dat men aan de kust graag verse vis met rijst eet?",
        answer: "Waar",
        explanation: "De bewering is waar: men aan de kust graag verse vis met rijst eet."
      },
      {
        question: "Klopt het dat men gastvrij drie glaasjes thee inschenkt?",
        answer: "Waar",
        explanation: "De bewering is waar: men gastvrij drie glaasjes thee inschenkt."
      },
      {
        question: "Wat vervoert de kilometerslange vrachttrein door de woestijn?",
        answer: "IJzererts",
        explanation: "Het antwoord is IJzererts; dit beantwoordt de vraag: Wat vervoert de kilometerslange vrachttrein door de woestijn?"
      },
      {
        question: "Welk beroemd nationaal park aan de kust trekt miljoenen trekvogels?",
        answer: "Banc d’Arguin",
        explanation: "Het antwoord is Banc d’Arguin; dit beantwoordt de vraag: Welk beroemd nationaal park aan de kust trekt miljoenen trekvogels?"
      }
    ]
  },
  MUS: {
    name: "Mauritius",
    questions: [
      {
        question: "Welke drie talen worden gesproken op het eiland Mauritius?",
        answer: "Creools, Frans en Engels",
        explanation: "Het antwoord is Creools, Frans en Engels; dit beantwoordt de vraag: Welke drie talen worden gesproken op het eiland Mauritius?"
      },
      {
        question: "Hoe heet de vrolijke, traditionele trommeldans van het eiland?",
        answer: "De sega",
        explanation: "Het antwoord is De sega; dit beantwoordt de vraag: Hoe heet de vrolijke, traditionele trommeldans van het eiland?"
      },
      {
        question: "Wat voor populair straatvoedsel is dholl puri?",
        answer: "Gefrituurde platbroodjes gevuld met geel erwtenmeel",
        explanation: "Het antwoord is Gefrituurde platbroodjes gevuld met geel erwtenmeel; dit beantwoordt de vraag: Wat voor populair straatvoedsel is dholl puri?"
      },
      {
        question: "Welke iconische uitgestorven vogel leefde vroeger alleen op dit eiland?",
        answer: "De Dodo",
        explanation: "Het antwoord is De Dodo; dit beantwoordt de vraag: Welke iconische uitgestorven vogel leefde vroeger alleen op dit eiland?"
      },
      {
        question: "Wat voor kleurrijke zandduinen kun je zien in Chamarel?",
        answer: "Zandduinen in 7 verschillende kleuren",
        explanation: "Het antwoord is Zandduinen in 7 verschillende kleuren; dit beantwoordt de vraag: Wat voor kleurrijke zandduinen kun je zien in Chamarel?"
      },
      {
        question: "In welke oceaan ligt Mauritius?",
        answer: "De Indische Oceaan",
        explanation: "Het antwoord is De Indische Oceaan; dit beantwoordt de vraag: In welke oceaan ligt Mauritius?"
      }
    ]
  },
  MOZ: {
    name: "Mozambique",
    questions: [
      {
        question: "Wat is de officiële taal van Mozambique?",
        answer: "Portugees",
        explanation: "Het antwoord is Portugees; dit beantwoordt de vraag: Wat is de officiële taal van Mozambique?"
      },
      {
        question: "Hoe heet de traditionele houten marimba uit Mozambique?",
        answer: "De timbila",
        explanation: "Het antwoord is De timbila; dit beantwoordt de vraag: Hoe heet de traditionele houten marimba uit Mozambique?"
      },
      {
        question: "Met welke pittige pepermarinade bereidt men gegrilde garnalen en kip?",
        answer: "Piri-piri",
        explanation: "Het antwoord is Piri-piri; dit beantwoordt de vraag: Met welke pittige pepermarinade bereidt men gegrilde garnalen en kip?"
      },
      {
        question: "Van welke donkere houtsoort maken ambachtslieden houtsnijwerk?",
        answer: "Ebbenhout",
        explanation: "Het antwoord is Ebbenhout; dit beantwoordt de vraag: Van welke donkere houtsoort maken ambachtslieden houtsnijwerk?"
      },
      {
        question: "Hoe heet de paradijselijke eilandengroep voor de kust?",
        answer: "De Bazaruto-archipel",
        explanation: "Het antwoord is De Bazaruto-archipel; dit beantwoordt de vraag: Hoe heet de paradijselijke eilandengroep voor de kust?"
      },
      {
        question: "Welk zeldzaam zeezoogdier (zeekoe) zwemt in de kustwateren?",
        answer: "De doejong",
        explanation: "Het antwoord is De doejong; dit beantwoordt de vraag: Welk zeldzaam zeezoogdier (zeekoe) zwemt in de kustwateren?"
      }
    ]
  },
  NAM: {
    name: "Namibië",
    questions: [
      {
        question: "Wat is de officiële taal van Namibië?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van Namibië?"
      },
      {
        question: "Klopt het dat stammen traditionele liederen zonder instrumenten zingen?",
        answer: "Waar",
        explanation: "De bewering is waar: stammen traditionele liederen zonder instrumenten zingen."
      },
      {
        question: "Wat voor straatvoedsel is kapana?",
        answer: "Vers gegrild en gekruid vlees op de markt",
        explanation: "Het antwoord is Vers gegrild en gekruid vlees op de markt; dit beantwoordt de vraag: Wat voor straatvoedsel is kapana?"
      },
      {
        question: "Waarom smeren Himba-vrouwen hun huid en haar in met okerpasta?",
        answer: "Ter bescherming tegen de zon en uit schoonheidsideaal",
        explanation: "Het antwoord is Ter bescherming tegen de zon en uit schoonheidsideaal; dit beantwoordt de vraag: Waarom smeren Himba-vrouwen hun huid en haar in met okerpasta?"
      },
      {
        question: "Hoe noemt men de beroemde vallei met rode zandduinen?",
        answer: "De Sossusvlei",
        explanation: "Het antwoord is De Sossusvlei; aanvullende uitleg: in de Namibwoestijn."
      },
      {
        question: "Welk is het snelste landdier dat veel in Namibië voorkomt?",
        answer: "Het jachtluipaard",
        explanation: "Het antwoord is Het jachtluipaard; dit beantwoordt de vraag: Welk is het snelste landdier dat veel in Namibië voorkomt?"
      }
    ]
  },
  NER: {
    name: "Niger",
    questions: [
      {
        question: "Wat is de officiële taal van Niger?",
        answer: "Frans",
        explanation: "Het antwoord is Frans; dit beantwoordt de vraag: Wat is de officiële taal van Niger?"
      },
      {
        question: "Klopt het dat nomaden in de woestijn opzwepende gitaarmuziek maken?",
        answer: "Waar",
        explanation: "De bewering is waar: nomaden in de woestijn opzwepende gitaarmuziek maken."
      },
      {
        question: "Wat eet men als basisvoedsel bereid met stoofpot?",
        answer: "Gierst",
        explanation: "Het antwoord is Gierst; aanvullende uitleg: gierstmeel-pap of deeg."
      },
      {
        question: "Hoe heet het feest waar jonge Wodaabe-mannen zich opmaken?",
        answer: "Het Guérewol-festival",
        explanation: "Het antwoord is Het Guérewol-festival; dit beantwoordt de vraag: Hoe heet het feest waar jonge Wodaabe-mannen zich opmaken?"
      },
      {
        question: "Welk beschermd natuurreservaat ligt in het Aïr-gebergte?",
        answer: "Het natuurreservaat Aïr en Ténéré",
        explanation: "Het antwoord is Het natuurreservaat Aïr en Ténéré; dit beantwoordt de vraag: Welk beschermd natuurreservaat ligt in het Aïr-gebergte?"
      },
      {
        question: "Welk zeldzaam giraffenras leeft in het wild in Niger?",
        answer: "De West-Afrikaanse giraf",
        explanation: "Het antwoord is De West-Afrikaanse giraf; dit beantwoordt de vraag: Welk zeldzaam giraffenras leeft in het wild in Niger?"
      }
    ]
  },
  UGA: {
    name: "Oeganda",
    questions: [
      {
        question: "Welke twee officiële talen kent Oeganda?",
        answer: "Engels en Swahili",
        explanation: "Het antwoord is Engels en Swahili; dit beantwoordt de vraag: Welke twee officiële talen kent Oeganda?"
      },
      {
        question: "Klopt het dat men traditionele muziek speelt op eensnarige instrumenten?",
        answer: "Waar",
        explanation: "De bewering is waar: men traditionele muziek speelt op eensnarige instrumenten."
      },
      {
        question: "Wat voor nationaal gerecht is matooke?",
        answer: "Gestoomde en geprakte groene kookbananen",
        explanation: "Het antwoord is Gestoomde en geprakte groene kookbananen; dit beantwoordt de vraag: Wat voor nationaal gerecht is matooke?"
      },
      {
        question: "Welke bijnaam gaf Winston Churchill aan Oeganda?",
        answer: "De Parel van Afrika",
        explanation: "Het antwoord is De Parel van Afrika; dit beantwoordt de vraag: Welke bijnaam gaf Winston Churchill aan Oeganda?"
      },
      {
        question: "Welke zeldzame mensaap leeft beschermd in het Bwindi-woud?",
        answer: "De berggorilla",
        explanation: "Het antwoord is De berggorilla; dit beantwoordt de vraag: Welke zeldzame mensaap leeft beschermd in het Bwindi-woud?"
      },
      {
        question: "In welk reusachtig meer ontspringt de rivier de Nijl?",
        answer: "Het Victoriameer",
        explanation: "Het antwoord is Het Victoriameer; dit beantwoordt de vraag: In welk reusachtig meer ontspringt de rivier de Nijl?"
      }
    ]
  },
  RWA: {
    name: "Rwanda",
    questions: [
      {
        question: "Welke taal spreekt men naast het Frans in Rwanda?",
        answer: "Kinyarwanda",
        explanation: "Het antwoord is Kinyarwanda; dit beantwoordt de vraag: Welke taal spreekt men naast het Frans in Rwanda?"
      },
      {
        question: "Hoe heet de elegante balletachtige traditionele krijgersdans?",
        answer: "De Intore-dans",
        explanation: "Het antwoord is De Intore-dans; dit beantwoordt de vraag: Hoe heet de elegante balletachtige traditionele krijgersdans?"
      },
      {
        question: "Wat voor spiesjes eet men veel op straat?",
        answer: "Geitenvleesspiesjes",
        explanation: "Het antwoord is Geitenvleesspiesjes; aanvullende uitleg: brochettes."
      },
      {
        question: "Hoe heet de jaarlijkse ceremonie waarbij baby-gorilla’s een naam krijgen?",
        answer: "Kwita Izina",
        explanation: "Het antwoord is Kwita Izina; dit beantwoordt de vraag: Hoe heet de jaarlijkse ceremonie waarbij baby-gorilla’s een naam krijgen?"
      },
      {
        question: "Welke bekende bijnaam heeft het bergachtige land Rwanda?",
        answer: "Het Land van de Duizend Heuvels",
        explanation: "Het antwoord is Het Land van de Duizend Heuvels; dit beantwoordt de vraag: Welke bekende bijnaam heeft het bergachtige land Rwanda?"
      },
      {
        question: "Wat is de schone en georganiseerde hoofdstad van Rwanda?",
        answer: "Kigali",
        explanation: "Het antwoord is Kigali; dit beantwoordt de vraag: Wat is de schone en georganiseerde hoofdstad van Rwanda?"
      }
    ]
  },
  STP: {
    name: "Sao Tomé en Principe",
    questions: [
      {
        question: "Wat is de officiële taal van São Tomé en Principe?",
        answer: "Portugees",
        explanation: "Het antwoord is Portugees; dit beantwoordt de vraag: Wat is de officiële taal van São Tomé en Principe?"
      },
      {
        question: "Klopt het dat je vrolijke dansmuziek op straat hoort?",
        answer: "Waar",
        explanation: "De bewering is waar: je vrolijke dansmuziek op straat hoort."
      },
      {
        question: "Wat voor traditioneel visgerecht is calulu?",
        answer: "Vis gekookt met verse kruiden, groenten en palmolie",
        explanation: "Het antwoord is Vis gekookt met verse kruiden, groenten en palmolie; dit beantwoordt de vraag: Wat voor traditioneel visgerecht is calulu?"
      },
      {
        question: "Hoe heet het middeleeuwse straattheater dat men opvoert?",
        answer: "Tchiloli",
        explanation: "Het antwoord is Tchiloli; dit beantwoordt de vraag: Hoe heet het middeleeuwse straattheater dat men opvoert?"
      },
      {
        question: "Hoe heet de steile vulkanische rotstoren die boven de jungle uitsteekt?",
        answer: "Pico Cão Grande",
        explanation: "Het antwoord is Pico Cão Grande; dit beantwoordt de vraag: Hoe heet de steile vulkanische rotstoren die boven de jungle uitsteekt?"
      },
      {
        question: "Om welk gewas stonden de eilanden vroeger bekend als de ’Chocolade-eilanden’?",
        answer: "Cacao",
        explanation: "Het antwoord is Cacao; dit beantwoordt de vraag: Om welk gewas stonden de eilanden vroeger bekend als de ’Chocolade-eilanden’?"
      }
    ]
  },
  SEN: {
    name: "Senegal",
    questions: [
      {
        question: "Wat is de officiële taal van Senegal?",
        answer: "Frans",
        explanation: "Het antwoord is Frans; dit beantwoordt de vraag: Wat is de officiële taal van Senegal?"
      },
      {
        question: "Welke populaire dansmuziek werd beroemd door Youssou N’Dour?",
        answer: "Mbalax",
        explanation: "Het antwoord is Mbalax; dit beantwoordt de vraag: Welke populaire dansmuziek werd beroemd door Youssou N’Dour?"
      },
      {
        question: "Wat voor nationaal gerecht is thieboudienne?",
        answer: "Een heerlijke maaltijd van vis, rijst en groenten",
        explanation: "Het antwoord is Een heerlijke maaltijd van vis, rijst en groenten; dit beantwoordt de vraag: Wat voor nationaal gerecht is thieboudienne?"
      },
      {
        question: "Welke gastvrijheidscultuur staat centraal in de Senegalese samenleving?",
        answer: "Teranga",
        explanation: "Het antwoord is Teranga; aanvullende uitleg: gastvrijheid."
      },
      {
        question: "Hoe heet het bijzondere meer dat een felroze kleur heeft?",
        answer: "Lac Rose",
        explanation: "Het antwoord is Lac Rose; aanvullende uitleg: Het Roze Meer / Meer van Retba."
      },
      {
        question: "Wat is de hoofdstad die op het westelijkste puntje van Afrika ligt?",
        answer: "Dakar",
        explanation: "Het antwoord is Dakar; dit beantwoordt de vraag: Wat is de hoofdstad die op het westelijkste puntje van Afrika ligt?"
      }
    ]
  },
  SYC: {
    name: "Seychellen",
    questions: [
      {
        question: "Welke drie talen zijn officieel op de Seychellen?",
        answer: "Seychellencreools, Frans en Engels",
        explanation: "Het antwoord is Seychellencreools, Frans en Engels; dit beantwoordt de vraag: Welke drie talen zijn officieel op de Seychellen?"
      },
      {
        question: "Hoe heet de traditionele trommeldans op het strand?",
        answer: "De moutya",
        explanation: "Het antwoord is De moutya; dit beantwoordt de vraag: Hoe heet de traditionele trommeldans op het strand?"
      },
      {
        question: "Welk ingrediënt maakt de lokale viscurry zo romig?",
        answer: "Verse kokosmelk",
        explanation: "Het antwoord is Verse kokosmelk; dit beantwoordt de vraag: Welk ingrediënt maakt de lokale viscurry zo romig?"
      },
      {
        question: "Hoe heet de reusachtige dubbele kokosnoot die hier groeit?",
        answer: "De coco de mer",
        explanation: "Het antwoord is De coco de mer; dit beantwoordt de vraag: Hoe heet de reusachtige dubbele kokosnoot die hier groeit?"
      },
      {
        question: "Welk reusachtig dier leeft in grote getale op het atol Aldabra?",
        answer: "De reuzenschildpad",
        explanation: "Het antwoord is De reuzenschildpad; dit beantwoordt de vraag: Welk reusachtig dier leeft in grote getale op het atol Aldabra?"
      },
      {
        question: "Uit hoeveel eilanden bestaat de Seychellen ongeveer (10 of ruim 100)?",
        answer: "Meer dan 100 eilanden",
        explanation: "Het antwoord is Meer dan 100 eilanden; aanvullende uitleg: 115 eilanden."
      }
    ]
  },
  SLE: {
    name: "Sierra Leone",
    questions: [
      {
        question: "Wat is de officiële taal van Sierra Leone?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van Sierra Leone?"
      },
      {
        question: "Klopt het dat men gitaarmuziek speelt bij het drinken van palmwijn?",
        answer: "Waar",
        explanation: "De bewering is waar: men gitaarmuziek speelt bij het drinken van palmwijn."
      },
      {
        question: "Klopt het dat men gekookte cassavebladeren met pinda’s en rijst eet?",
        answer: "Waar",
        explanation: "De bewering is waar: men gekookte cassavebladeren met pinda’s en rijst eet."
      },
      {
        question: "Wat voor kleurrijke optocht viert men tijdens feestdagen?",
        answer: "Een lantaarnoptocht",
        explanation: "Het antwoord is Een lantaarnoptocht; dit beantwoordt de vraag: Wat voor kleurrijke optocht viert men tijdens feestdagen?"
      },
      {
        question: "Om welke kostbare edelsteen staat de geschiedenis van het land bekend?",
        answer: "Diamanten",
        explanation: "Het antwoord is Diamanten; dit beantwoordt de vraag: Om welke kostbare edelsteen staat de geschiedenis van het land bekend?"
      },
      {
        question: "Wat is de hoofdstad van Sierra Leone?",
        answer: "Freetown",
        explanation: "Het antwoord is Freetown; dit beantwoordt de vraag: Wat is de hoofdstad van Sierra Leone?"
      }
    ]
  },
  SOM: {
    name: "Somalië",
    questions: [
      {
        question: "Wat is de officiële taal van Somalië?",
        answer: "Somalisch",
        explanation: "Het antwoord is Somalisch; aanvullende uitleg: en Arabisch."
      },
      {
        question: "Klopt het dat men in Somalië veel van poëzie en verskunst houdt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Somalië veel van poëzie en verskunst houdt."
      },
      {
        question: "Welke fruitsoort serveert men traditioneel bij de warme rijstmaaltijd?",
        answer: "Een banaan",
        explanation: "Het antwoord is Een banaan; dit beantwoordt de vraag: Welke fruitsoort serveert men traditioneel bij de warme rijstmaaltijd?"
      },
      {
        question: "Welke bijnaam heeft Somalië vanwege haar rijke dichttraditie?",
        answer: "De Natie van Dichters",
        explanation: "Het antwoord is De Natie van Dichters; dit beantwoordt de vraag: Welke bijnaam heeft Somalië vanwege haar rijke dichttraditie?"
      },
      {
        question: "Klopt het dat Somalië de langste kustlijn van het Afrikaanse vasteland heeft?",
        answer: "Waar",
        explanation: "De bewering is waar: Somalië de langste kustlijn van het Afrikaanse vasteland heeft."
      },
      {
        question: "Wat is de hoofdstad van Somalië?",
        answer: "Mogadishu",
        explanation: "Het antwoord is Mogadishu; dit beantwoordt de vraag: Wat is de hoofdstad van Somalië?"
      }
    ]
  },
  SDN: {
    name: "Soedan",
    questions: [
      {
        question: "Wat is de officiële taal van Soedan?",
        answer: "Arabisch",
        explanation: "Het antwoord is Arabisch; dit beantwoordt de vraag: Wat is de officiële taal van Soedan?"
      },
      {
        question: "Hoe heet het traditionele houten snaarinstrument?",
        answer: "De tambour",
        explanation: "Het antwoord is De tambour; dit beantwoordt de vraag: Hoe heet het traditionele houten snaarinstrument?"
      },
      {
        question: "Wat voor gerecht is ful medames?",
        answer: "Geprakte tuinbonen overgoten met olijfolie en kruiden",
        explanation: "Het antwoord is Geprakte tuinbonen overgoten met olijfolie en kruiden; dit beantwoordt de vraag: Wat voor gerecht is ful medames?"
      },
      {
        question: "Klopt het dat de bruid bij bruiloften een speciale dans uitvoert?",
        answer: "Waar",
        explanation: "De bewering is waar: de bruid bij bruiloften een speciale dans uitvoert."
      },
      {
        question: "Staan er in Soedan meer of minder piramides dan in Egypte?",
        answer: "Meer piramides",
        explanation: "Het antwoord is Meer piramides; aanvullende uitleg: de piramides van Meroë."
      },
      {
        question: "Welke twee rivieren (Blauwe en Witte) komen bij Khartoem samen?",
        answer: "De Blauwe Nijl en de Witte Nijl",
        explanation: "Het antwoord is De Blauwe Nijl en de Witte Nijl; dit beantwoordt de vraag: Welke twee rivieren (Blauwe en Witte) komen bij Khartoem samen?"
      }
    ]
  },
  SSD: {
    name: "Zuid-Soedan",
    questions: [
      {
        question: "Wat is de officiële taal van Zuid-Soedan?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van Zuid-Soedan?"
      },
      {
        question: "Klopt het dat de verschillende stammen traditionele sprongdansen uitvoeren?",
        answer: "Waar",
        explanation: "De bewering is waar: de verschillende stammen traditionele sprongdansen uitvoeren."
      },
      {
        question: "Wat eet men als belangrijk basisvoedsel?",
        answer: "Gierst- of maïsdeeg",
        explanation: "Het antwoord is Gierst- of maïsdeeg; aanvullende uitleg: Asida."
      },
      {
        question: "Welke dieren spelen de centrale rol in rijkdom en status van stammen?",
        answer: "Runderen / Vee",
        explanation: "Het antwoord is Runderen / Vee; dit beantwoordt de vraag: Welke dieren spelen de centrale rol in rijkdom en status van stammen?"
      },
      {
        question: "Hoe heet het reusachtige moerasgebied gevormd door de Nijl?",
        answer: "Het Sudd-moeras",
        explanation: "Het antwoord is Het Sudd-moeras; dit beantwoordt de vraag: Hoe heet het reusachtige moerasgebied gevormd door de Nijl?"
      },
      {
        question: "In welk jaar werd Zuid-Soedan onafhankelijk (het jongste land ter wereld)?",
        answer: "In 2011",
        explanation: "Het antwoord is In 2011; dit beantwoordt de vraag: In welk jaar werd Zuid-Soedan onafhankelijk (het jongste land ter wereld)?"
      }
    ]
  },
  TGO: {
    name: "Togo",
    questions: [
      {
        question: "Wat is de officiële taal van Togo?",
        answer: "Frans",
        explanation: "Het antwoord is Frans; dit beantwoordt de vraag: Wat is de officiële taal van Togo?"
      },
      {
        question: "Klopt het dat men bij feesten traditionele trommels bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men bij feesten traditionele trommels bespeelt."
      },
      {
        question: "Wat voor gerecht is fufu?",
        answer: "Gestampte deegbal van yam of cassave gegeten met soep",
        explanation: "Het antwoord is Gestampte deegbal van yam of cassave gegeten met soep; dit beantwoordt de vraag: Wat voor gerecht is fufu?"
      },
      {
        question: "Bij welk heilig object viert men het traditionele nieuwjaarsfeest?",
        answer: "De Heilige Steen",
        explanation: "Het antwoord is De Heilige Steen; aanvullende uitleg: Epe-Ekpe."
      },
      {
        question: "Hoe heten de unieke, traditionele, lemen kasteelachtige huizen in het noorden?",
        answer: "Takienta",
        explanation: "Het antwoord is Takienta; aanvullende uitleg: tata somba."
      },
      {
        question: "Wat is de hoofdstad van Togo?",
        answer: "Lomé",
        explanation: "Het antwoord is Lomé; dit beantwoordt de vraag: Wat is de hoofdstad van Togo?"
      }
    ]
  },
  TCD: {
    name: "Tsjaad",
    questions: [
      {
        question: "Welke twee talen zijn officieel in Tsjaad?",
        answer: "Frans en Arabisch",
        explanation: "Het antwoord is Frans en Arabisch; dit beantwoordt de vraag: Welke twee talen zijn officieel in Tsjaad?"
      },
      {
        question: "Klopt het dat tamtamtrommels de dorpsdansen begeleiden?",
        answer: "Waar",
        explanation: "De bewering is waar: tamtamtrommels de dorpsdansen begeleiden."
      },
      {
        question: "Wat eet men als traditionele deegbal die in saus wordt gedoopt?",
        answer: "Gierstdeeg",
        explanation: "Het antwoord is Gierstdeeg; aanvullende uitleg: Boule de millet."
      },
      {
        question: "Wat doen jonge mannen met hun gezicht tijdens het Gerewol-feest?",
        answer: "Ze schminken hun gezicht fel en maken hun tanden en ogen wit",
        explanation: "Het antwoord is Ze schminken hun gezicht fel en maken hun tanden en ogen wit; dit beantwoordt de vraag: Wat doen jonge mannen met hun gezicht tijdens het Gerewol-feest?"
      },
      {
        question: "Wat gebeurt er met het grote Tsjaadmeer in tijden van droogte?",
        answer: "Het krimpt sterk in omvang",
        explanation: "Het antwoord is Het krimpt sterk in omvang; dit beantwoordt de vraag: Wat gebeurt er met het grote Tsjaadmeer in tijden van droogte?"
      },
      {
        question: "Klopt het dat er in de woestijn indrukwekkende rotsbogen te zien zijn?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: in het Ennedi-massief."
      }
    ]
  },
  TUN: {
    name: "Tunesië",
    questions: [
      {
        question: "Wat is de officiële taal van Tunesië?",
        answer: "Arabisch",
        explanation: "Het antwoord is Arabisch; dit beantwoordt de vraag: Wat is de officiële taal van Tunesië?"
      },
      {
        question: "Klopt het dat men van klassieke Arabische malouf-muziek houdt?",
        answer: "Waar",
        explanation: "De bewering is waar: men van klassieke Arabische malouf-muziek houdt."
      },
      {
        question: "Wat voor ingrediënt is harissa?",
        answer: "Een scherpe rode peperpasta met knoflook en kruiden",
        explanation: "Het antwoord is Een scherpe rode peperpasta met knoflook en kruiden; dit beantwoordt de vraag: Wat voor ingrediënt is harissa?"
      },
      {
        question: "Welke beroemde oude ruïnestad van de Carthagers ligt in Tunesië?",
        answer: "Carthago",
        explanation: "Het antwoord is Carthago; dit beantwoordt de vraag: Welke beroemde oude ruïnestad van de Carthagers ligt in Tunesië?"
      },
      {
        question: "Voor welke beroemde Hollywoodfilmreeks diende het woestijndorp als filmset?",
        answer: "Star Wars",
        explanation: "Het antwoord is Star Wars; aanvullende uitleg: de planeet Tatooine."
      },
      {
        question: "Klopt het dat Tunesië aan de Middellandse Zee ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Tunesië aan de Middellandse Zee ligt."
      }
    ]
  },
  ZMB: {
    name: "Zambia",
    questions: [
      {
        question: "Wat is de officiële taal van Zambia?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van Zambia?"
      },
      {
        question: "Welke populaire gitaarstijl hoor je in Zambia?",
        answer: "Kalindula",
        explanation: "Het antwoord is Kalindula; dit beantwoordt de vraag: Welke populaire gitaarstijl hoor je in Zambia?"
      },
      {
        question: "Wat voor nationaal gerecht is nshima?",
        answer: "Een dikke maïsmeel-pap gegeten met de rechterhand",
        explanation: "Het antwoord is Een dikke maïsmeel-pap gegeten met de rechterhand; dit beantwoordt de vraag: Wat voor nationaal gerecht is nshima?"
      },
      {
        question: "In wat voor kleur boot vaart de koning tijdens het Kuomboka-feest?",
        answer: "Een grote zwarte boot",
        explanation: "Het antwoord is Een grote zwarte boot; aanvullende uitleg: met een olifant erop."
      },
      {
        question: "Hoe heten de reusachtige watervallen op de grens van Zambia en Zimbabwe?",
        answer: "De Victoriawatervallen",
        explanation: "Het antwoord is De Victoriawatervallen; aanvullende uitleg: Mosi-oa-Tunya."
      },
      {
        question: "Welke grote rivier geeft haar naam aan het land Zambia?",
        answer: "De Zambezi-rivier",
        explanation: "Het antwoord is De Zambezi-rivier; dit beantwoordt de vraag: Welke grote rivier geeft haar naam aan het land Zambia?"
      }
    ]
  },
  ZWE: {
    name: "Zimbabwe",
    questions: [
      {
        question: "Welke twee talen worden het meest gesproken in Zimbabwe?",
        answer: "Engels en Shona",
        explanation: "Het antwoord is Engels en Shona; dit beantwoordt de vraag: Welke twee talen worden het meest gesproken in Zimbabwe?"
      },
      {
        question: "Hoe heet de heilige duimpiano met metalen toetsen?",
        answer: "De mbira",
        explanation: "Het antwoord is De mbira; dit beantwoordt de vraag: Hoe heet de heilige duimpiano met metalen toetsen?"
      },
      {
        question: "Wat voor gerecht is sadza?",
        answer: "Een dikke maïsmeel-pap geserveerd met groenten en vlees",
        explanation: "Het antwoord is Een dikke maïsmeel-pap geserveerd met groenten en vlees; dit beantwoordt de vraag: Wat voor gerecht is sadza?"
      },
      {
        question: "Om welke ambachtelijke kunstvorm staat Zimbabwe wereldberoemd bekend?",
        answer: "Stenen beeldhouwkunst",
        explanation: "Het antwoord is Stenen beeldhouwkunst; aanvullende uitleg: Shona sculpturen."
      },
      {
        question: "Hoe heten de indrukwekkende middeleeuwse stenen ruïnes?",
        answer: "Groot Zimbabwe",
        explanation: "Het antwoord is Groot Zimbabwe; aanvullende uitleg: Great Zimbabwe."
      },
      {
        question: "Klopt het dat Zimbabwe en Zambia samen de Victoriawatervallen delen?",
        answer: "Waar",
        explanation: "De bewering is waar: Zimbabwe en Zambia samen de Victoriawatervallen delen."
      }
    ]
  },
  USA: {
    name: "Verenigde Staten",
    questions: [
      {
        question: "Klopt het dat er in de VS naast Engels ook op grote schaal Spaans wordt gesproken?",
        answer: "Waar",
        explanation: "De bewering is waar: er in de VS naast Engels ook op grote schaal Spaans wordt gesproken."
      },
      {
        question: "In welke stad in Louisiana is het muziekgenre Jazz ontstaan?",
        answer: "New Orleans",
        explanation: "Het antwoord is New Orleans; dit beantwoordt de vraag: In welke stad in Louisiana is het muziekgenre Jazz ontstaan?"
      },
      {
        question: "Welke zoete, gebakken taart met appeltjes geldt als nationaal symbool?",
        answer: "Apple Pie",
        explanation: "Het antwoord is Apple Pie; aanvullende uitleg: Appeltaart."
      },
      {
        question: "Op welke donderdag in november viert men Thanksgiving?",
        answer: "De 4e donderdag van november",
        explanation: "Het antwoord is De 4e donderdag van november; dit beantwoordt de vraag: Op welke donderdag in november viert men Thanksgiving?"
      },
      {
        question: "Welke reusachtige, diepe kloof in Arizona is door een rivier uitgesleten?",
        answer: "De Grand Canyon",
        explanation: "Het antwoord is De Grand Canyon; dit beantwoordt de vraag: Welke reusachtige, diepe kloof in Arizona is door een rivier uitgesleten?"
      },
      {
        question: "Hoeveel witte sterren staan er op de vlag van de VS?",
        answer: "50 sterren",
        explanation: "Het antwoord is 50 sterren; dit beantwoordt de vraag: Hoeveel witte sterren staan er op de vlag van de VS?"
      }
    ]
  },
  MEX: {
    name: "Mexico",
    questions: [
      {
        question: "Klopt het dat er in Mexico naast het Spaans ook inheemse Maya- en Nahuatltalen worden gesproken?",
        answer: "Waar",
        explanation: "De bewering is waar: er in Mexico naast het Spaans ook inheemse Maya- en Nahuatltalen worden gesproken."
      },
      {
        question: "Hoe heet een traditioneel Mexicaans straatorkestje met grote sombreros?",
        answer: "Mariachi",
        explanation: "Het antwoord is Mariachi; dit beantwoordt de vraag: Hoe heet een traditioneel Mexicaans straatorkestje met grote sombreros?"
      },
      {
        question: "Wat is een taco?",
        answer: "Een opgerolde of gevouwen maïstortilla met vulling",
        explanation: "Het antwoord is Een opgerolde of gevouwen maïstortilla met vulling; dit beantwoordt de vraag: Wat is een taco?"
      },
      {
        question: "Hoe heet de feestdag waarop men overleden dierbaren herdenkt met altaren?",
        answer: "Día de los Muertos",
        explanation: "Het antwoord is Día de los Muertos; aanvullende uitleg: Dag van de Doden."
      },
      {
        question: "Welke felgekleurde oranje vlinders vliegen naar Mexico om te overwinteren?",
        answer: "De monarchvlinder",
        explanation: "Het antwoord is De monarchvlinder; dit beantwoordt de vraag: Welke felgekleurde oranje vlinders vliegen naar Mexico om te overwinteren?"
      },
      {
        question: "Hoe heet de beroemde oude Mayapiramide in Chichén Itzá?",
        answer: "El Castillo",
        explanation: "Het antwoord is El Castillo; dit beantwoordt de vraag: Hoe heet de beroemde oude Mayapiramide in Chichén Itzá?"
      }
    ]
  },
  CAN: {
    name: "Canada",
    questions: [
      {
        question: "Welke twee talen zijn officieel in Canada?",
        answer: "Engels en Frans",
        explanation: "Het antwoord is Engels en Frans; dit beantwoordt de vraag: Welke twee talen zijn officieel in Canada?"
      },
      {
        question: "Klopt het dat inheemse volkeren trommelmuziek maken bij de powwowbijeenkomst?",
        answer: "Waar",
        explanation: "De bewering is waar: inheemse volkeren trommelmuziek maken bij de powwowbijeenkomst."
      },
      {
        question: "Wat zit er op het Canadese patatgerecht poutine?",
        answer: "Verse kaascurds en warme jus",
        explanation: "Het antwoord is Verse kaascurds en warme jus; dit beantwoordt de vraag: Wat zit er op het Canadese patatgerecht poutine?"
      },
      {
        question: "Welke snelle sport op het ijs met een puck is de nationale wintersport?",
        answer: "IJshockey",
        explanation: "Het antwoord is IJshockey; dit beantwoordt de vraag: Welke snelle sport op het ijs met een puck is de nationale wintersport?"
      },
      {
        question: "Welk blad staat centraal afgebeeld op de Canadese vlag?",
        answer: "Het Esdoornblad",
        explanation: "Het antwoord is Het Esdoornblad; aanvullende uitleg: Maple leaf."
      },
      {
        question: "Klopt het dat Canada qua oppervlakte, na Rusland, het grootste land ter wereld is?",
        answer: "Waar",
        explanation: "De bewering is waar: Canada qua oppervlakte, na Rusland, het grootste land ter wereld is."
      }
    ]
  },
  JAM: {
    name: "Jamaica",
    questions: [
      {
        question: "Klopt het dat men op Jamaica Engels en de creooltaal Patois spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men op Jamaica Engels en de creooltaal Patois spreekt."
      },
      {
        question: "Welke legendarische zanger maakte de Reggae-muziek wereldberoemd?",
        answer: "Bob Marley",
        explanation: "Het antwoord is Bob Marley; dit beantwoordt de vraag: Welke legendarische zanger maakte de Reggae-muziek wereldberoemd?"
      },
      {
        question: "Wat voor pittige bereiding van specerijen gebruikt men voor jerk chicken?",
        answer: "Een vurige marinade met piment en pepers",
        explanation: "Het antwoord is Een vurige marinade met piment en pepers; dit beantwoordt de vraag: Wat voor pittige bereiding van specerijen gebruikt men voor jerk chicken?"
      },
      {
        question: "Welke religieuze en culturele beweging met dreadlocks ontstond op Jamaica?",
        answer: "Rastafari",
        explanation: "Het antwoord is Rastafari; dit beantwoordt de vraag: Welke religieuze en culturele beweging met dreadlocks ontstond op Jamaica?"
      },
      {
        question: "Om welk kwaliteitsproduct staan de Blue Mountains in Jamaica bekend?",
        answer: "Exclusieve koffie",
        explanation: "Het antwoord is Exclusieve koffie; aanvullende uitleg: Blue Mountain Coffee."
      },
      {
        question: "Welke op Jamaica geboren sprinter is de snelste man ooit op de 100 meter?",
        answer: "Usain Bolt",
        explanation: "Het antwoord is Usain Bolt; dit beantwoordt de vraag: Welke op Jamaica geboren sprinter is de snelste man ooit op de 100 meter?"
      }
    ]
  },
  CUB: {
    name: "Cuba",
    questions: [
      {
        question: "Wat is de officiële taal van Cuba?",
        answer: "Spaans",
        explanation: "Het antwoord is Spaans; dit beantwoordt de vraag: Wat is de officiële taal van Cuba?"
      },
      {
        question: "Welke Cubaanse muziekstijl werd wereldberoemd door oude muzikanten?",
        answer: "Buena Vista Social Club",
        explanation: "Het antwoord is Buena Vista Social Club; aanvullende uitleg: Son / Salsa."
      },
      {
        question: "Wat voor nationaal gerecht is ropa vieja?",
        answer: "Gestoofd en geplozen rundvlees in tomatensaus",
        explanation: "Het antwoord is Gestoofd en geplozen rundvlees in tomatensaus; dit beantwoordt de vraag: Wat voor nationaal gerecht is ropa vieja?"
      },
      {
        question: "Wat voor opvallende oude auto’s rijden er nog volop in de straten van Havana?",
        answer: "Kleurrijke Amerikaanse oldtimers uit de jaren 50",
        explanation: "Het antwoord is Kleurrijke Amerikaanse oldtimers uit de jaren 50; dit beantwoordt de vraag: Wat voor opvallende oude auto’s rijden er nog volop in de straten van Havana?"
      },
      {
        question: "Welk piepklein vogeltje (de kleinste ter wereld) leeft op Cuba?",
        answer: "De bijenkolibrie",
        explanation: "Het antwoord is De bijenkolibrie; dit beantwoordt de vraag: Welk piepklein vogeltje (de kleinste ter wereld) leeft op Cuba?"
      },
      {
        question: "Om welk handgerold tabaksproduct staat Cuba wereldberoemd bekend?",
        answer: "Cubaanse sigaren",
        explanation: "Het antwoord is Cubaanse sigaren; dit beantwoordt de vraag: Om welk handgerold tabaksproduct staat Cuba wereldberoemd bekend?"
      }
    ]
  },
  CRI: {
    name: "Costa Rica",
    questions: [
      {
        question: "Welke bekende nationale slogan gebruiken inwoners als groet en motto?",
        answer: "Pura Vida!",
        explanation: "Het antwoord is Pura Vida!; aanvullende uitleg: Puur Leven."
      },
      {
        question: "Klopt het dat men van Latijns-Amerikaanse dansmuziek zoals salsa en bachata houdt?",
        answer: "Waar",
        explanation: "De bewering is waar: men van Latijns-Amerikaanse dansmuziek zoals salsa en bachata houdt."
      },
      {
        question: "Wat zit er in het traditionele ontbijtgerecht gallo pinto?",
        answer: "Rijst en zwarte bonen gemengd met kruiden",
        explanation: "Het antwoord is Rijst en zwarte bonen gemengd met kruiden; dit beantwoordt de vraag: Wat zit er in het traditionele ontbijtgerecht gallo pinto?"
      },
      {
        question: "In welk jaar schafte Costa Rica haar hele leger definitief af?",
        answer: "In 1948",
        explanation: "Het antwoord is In 1948; dit beantwoordt de vraag: In welk jaar schafte Costa Rica haar hele leger definitief af?"
      },
      {
        question: "Welk traag zoogdier dat ondersteboven in de bomen hangt is een icoon van het land?",
        answer: "De luiaard",
        explanation: "Het antwoord is De luiaard; dit beantwoordt de vraag: Welk traag zoogdier dat ondersteboven in de bomen hangt is een icoon van het land?"
      },
      {
        question: "Klopt het dat ruim een kwart van het land uit beschermde nationale parken bestaat?",
        answer: "Waar",
        explanation: "De bewering is waar: ruim een kwart van het land uit beschermde nationale parken bestaat."
      }
    ]
  },
  ATG: {
    name: "Antigua en Barbuda",
    questions: [
      {
        question: "Wat is de officiële taal van Antigua en Barbuda?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van Antigua en Barbuda?"
      },
      {
        question: "Klopt het dat men trommels bespeelt die zijn gemaakt van stalen olievaten (steelpan)?",
        answer: "Waar",
        explanation: "De bewering is waar: men trommels bespeelt die zijn gemaakt van stalen olievaten (steelpan)."
      },
      {
        question: "Wat eet men als traditionele maïsmeelstoofpot?",
        answer: "Fungie en Pepperpot",
        explanation: "Het antwoord is Fungie en Pepperpot; dit beantwoordt de vraag: Wat eet men als traditionele maïsmeelstoofpot?"
      },
      {
        question: "Klopt het dat men in de zomer een kleurrijk straatcarnaval viert?",
        answer: "Waar",
        explanation: "De bewering is waar: men in de zomer een kleurrijk straatcarnaval viert."
      },
      {
        question: "Hoeveel zandstranden beweert het eiland Antigua exact te hebben?",
        answer: "365 stranden",
        explanation: "Het antwoord is 365 stranden; aanvullende uitleg: voor elke dag één."
      },
      {
        question: "Klopt het dat Antigua en Barbuda tropische eilanden in de Caraïben zijn?",
        answer: "Waar",
        explanation: "De bewering is waar: Antigua en Barbuda tropische eilanden in de Caraïben zijn."
      }
    ]
  },
  BHS: {
    name: "Bahama’s",
    questions: [
      {
        question: "Wat is de officiële taal van de Bahama’s?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van de Bahama’s?"
      },
      {
        question: "Hoe heet de feestelijke straatparade met koebellen en trommels?",
        answer: "Junkanoo",
        explanation: "Het antwoord is Junkanoo; dit beantwoordt de vraag: Hoe heet de feestelijke straatparade met koebellen en trommels?"
      },
      {
        question: "Wat voor zeevrucht gebruikt men in de frisse conchsalade?",
        answer: "De koninginschelp",
        explanation: "Het antwoord is De koninginschelp; aanvullende uitleg: Conch."
      },
      {
        question: "Klopt het dat dansers prachtige verenkostuums aantrekken?",
        answer: "Waar",
        explanation: "De bewering is waar: dansers prachtige verenkostuums aantrekken."
      },
      {
        question: "Op welk bijzonder strand kun je zwemmen met dieren?",
        answer: "Pig Beach",
        explanation: "Het antwoord is Pig Beach; aanvullende uitleg: zwemmen met wilde varkens."
      },
      {
        question: "Klopt het dat de staat uit honderden koraaleilandjes bestaat?",
        answer: "Waar",
        explanation: "De bewering is waar: de staat uit honderden koraaleilandjes bestaat."
      }
    ]
  },
  BRB: {
    name: "Barbados",
    questions: [
      {
        question: "Wat is de officiële taal op Barbados?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal op Barbados?"
      },
      {
        question: "Welke wereldberoemde popzangeres werd geboren op Barbados?",
        answer: "Rihanna",
        explanation: "Het antwoord is Rihanna; dit beantwoordt de vraag: Welke wereldberoemde popzangeres werd geboren op Barbados?"
      },
      {
        question: "Welke bijzondere vis serveert men traditioneel met cou-cou?",
        answer: "Vliegende vis",
        explanation: "Het antwoord is Vliegende vis; dit beantwoordt de vraag: Welke bijzondere vis serveert men traditioneel met cou-cou?"
      },
      {
        question: "Hoe heet het historische zomerse oogstfeest?",
        answer: "Crop Over",
        explanation: "Het antwoord is Crop Over; dit beantwoordt de vraag: Hoe heet het historische zomerse oogstfeest?"
      },
      {
        question: "Welke mooie grot vol ondergrondse meren ligt op Barbados?",
        answer: "Harrison’s Cave",
        explanation: "Het antwoord is Harrison’s Cave; dit beantwoordt de vraag: Welke mooie grot vol ondergrondse meren ligt op Barbados?"
      },
      {
        question: "Klopt het dat Barbados in het Caribisch gebied ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Barbados in het Caribisch gebied ligt."
      }
    ]
  },
  BLZ: {
    name: "Belize",
    questions: [
      {
        question: "Welke officiële taal heeft Belize, als enige land in Midden-Amerika?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Welke officiële taal heeft Belize, als enige land in Midden-Amerika?"
      },
      {
        question: "Klopt het dat mensen dansen op de trommelmuziek van de Garifuna?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen dansen op de trommelmuziek van de Garifuna."
      },
      {
        question: "Waarin kookt men de rijst en bonen voor extra smaak?",
        answer: "In kokosmelk",
        explanation: "Het antwoord is In kokosmelk; dit beantwoordt de vraag: Waarin kookt men de rijst en bonen voor extra smaak?"
      },
      {
        question: "In welke maand viert men Garifuna Settlement Day?",
        answer: "In november",
        explanation: "Het antwoord is In november; dit beantwoordt de vraag: In welke maand viert men Garifuna Settlement Day?"
      },
      {
        question: "Hoe heet het reusachtige, ronde onderwaterzinkgat voor de kust?",
        answer: "The Great Blue Hole",
        explanation: "Het antwoord is The Great Blue Hole; dit beantwoordt de vraag: Hoe heet het reusachtige, ronde onderwaterzinkgat voor de kust?"
      },
      {
        question: "Welk groot roofdier sluipt door de jungle van Belize?",
        answer: "De Jaguar",
        explanation: "Het antwoord is De Jaguar; dit beantwoordt de vraag: Welk groot roofdier sluipt door de jungle van Belize?"
      }
    ]
  },
  DMA: {
    name: "Dominica",
    questions: [
      {
        question: "Wat is de officiële taal van het natuureiland Dominica?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van het natuureiland Dominica?"
      },
      {
        question: "Klopt het dat muzikanten een mix van soca en calypso maken?",
        answer: "Waar",
        explanation: "De bewering is waar: muzikanten een mix van soca en calypso maken."
      },
      {
        question: "Waarom noemt men Dominica het ’Natuureiland’?",
        answer: "Vanwege de 365 rivieren, regenwouden en vulkanen",
        explanation: "Het antwoord is Vanwege de 365 rivieren, regenwouden en vulkanen; dit beantwoordt de vraag: Waarom noemt men Dominica het ’Natuureiland’?"
      },
      {
        question: "Klopt het dat men een vrolijk straatcarnaval viert?",
        answer: "Waar",
        explanation: "De bewering is waar: men een vrolijk straatcarnaval viert."
      },
      {
        question: "Hoe heet het hete vulkanische meer midden in de natuur?",
        answer: "Boiling Lake",
        explanation: "Het antwoord is Boiling Lake; aanvullende uitleg: het Kookmeer."
      },
      {
        question: "Klopt het dat het eiland overdekt is met groen nevelwoud?",
        answer: "Waar",
        explanation: "De bewering is waar: het eiland overdekt is met groen nevelwoud."
      }
    ]
  },
  DOM: {
    name: "Dominikaanse Republiek",
    questions: [
      {
        question: "Wat is de officiële taal van de Dominikaanse Republiek?",
        answer: "Spaans",
        explanation: "Het antwoord is Spaans; dit beantwoordt de vraag: Wat is de officiële taal van de Dominikaanse Republiek?"
      },
      {
        question: "Welke twee populaire dansstijlen zijn hier ontstaan?",
        answer: "Merengue en Bachata",
        explanation: "Het antwoord is Merengue en Bachata; dit beantwoordt de vraag: Welke twee populaire dansstijlen zijn hier ontstaan?"
      },
      {
        question: "Hoe noemt men het traditionele lunchgerecht van rijst, bonen en vlees?",
        answer: "La Bandera",
        explanation: "Het antwoord is La Bandera; aanvullende uitleg: De Vlag."
      },
      {
        question: "Wat voor maskers dragen mensen tijdens het carnaval?",
        answer: "Uitbundige duivelsmaskers",
        explanation: "Het antwoord is Uitbundige duivelsmaskers; aanvullende uitleg: Diablos Cojuelos."
      },
      {
        question: "Welke reusachtige zeedieren komen elk voorjaar in de baai van Samaná?",
        answer: "Bultrugwalvissen",
        explanation: "Het antwoord is Bultrugwalvissen; dit beantwoordt de vraag: Welke reusachtige zeedieren komen elk voorjaar in de baai van Samaná?"
      },
      {
        question: "Met welk land deelt de Dominikaanse Republiek het eiland?",
        answer: "Haïti",
        explanation: "Het antwoord is Haïti; dit beantwoordt de vraag: Met welk land deelt de Dominikaanse Republiek het eiland?"
      }
    ]
  },
  SLV: {
    name: "El Salvador",
    questions: [
      {
        question: "Wat is de officiële taal in El Salvador?",
        answer: "Spaans",
        explanation: "Het antwoord is Spaans; dit beantwoordt de vraag: Wat is de officiële taal in El Salvador?"
      },
      {
        question: "Klopt het dat mensen graag naar vrolijke cumbiamuziek luisteren?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen graag naar vrolijke cumbiamuziek luisteren."
      },
      {
        question: "Wat zijn pupusas voor een lekkernij?",
        answer: "Dikke maïskoekjes gevuld met kaas, bonen of vlees",
        explanation: "Het antwoord is Dikke maïskoekjes gevuld met kaas, bonen of vlees; dit beantwoordt de vraag: Wat zijn pupusas voor een lekkernij?"
      },
      {
        question: "In welke maand viert men de Fiestas Augustinas?",
        answer: "In augustus",
        explanation: "Het antwoord is In augustus; dit beantwoordt de vraag: In welke maand viert men de Fiestas Augustinas?"
      },
      {
        question: "Welke bijnaam heeft El Salvador vanwege haar landschap?",
        answer: "Het Land van de Vulkanen",
        explanation: "Het antwoord is Het Land van de Vulkanen; dit beantwoordt de vraag: Welke bijnaam heeft El Salvador vanwege haar landschap?"
      },
      {
        question: "Klopt het dat El Salvador het kleinste land van Midden-Amerika is?",
        answer: "Waar",
        explanation: "De bewering is waar: El Salvador het kleinste land van Midden-Amerika is."
      }
    ]
  },
  GRD: {
    name: "Grenada",
    questions: [
      {
        question: "Wat is de officiële taal op Grenada?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal op Grenada?"
      },
      {
        question: "Klopt het dat men van vrolijke calypso- en socamuziek houdt?",
        answer: "Waar",
        explanation: "De bewering is waar: men van vrolijke calypso- en socamuziek houdt."
      },
      {
        question: "Wat voor nationaal gerecht is oil down?",
        answer: "Een rijke stoofpot van broodvrucht, kokosmelk en vlees of vis",
        explanation: "Het antwoord is Een rijke stoofpot van broodvrucht, kokosmelk en vlees of vis; dit beantwoordt de vraag: Wat voor nationaal gerecht is oil down?"
      },
      {
        question: "Welke geurige bijnaam heeft het eiland Grenada?",
        answer: "Het Specerijen-eiland",
        explanation: "Het antwoord is Het Specerijen-eiland; aanvullende uitleg: Island of Spice."
      },
      {
        question: "Welke specerij staat afgebeeld op de nationale vlag?",
        answer: "De nootmuskaat",
        explanation: "Het antwoord is De nootmuskaat; dit beantwoordt de vraag: Welke specerij staat afgebeeld op de nationale vlag?"
      },
      {
        question: "Klopt het dat er veel nootmuskaatbomen op het eiland groeien?",
        answer: "Waar",
        explanation: "De bewering is waar: er veel nootmuskaatbomen op het eiland groeien."
      }
    ]
  },
  GTM: {
    name: "Guatemala",
    questions: [
      {
        question: "Klopt het dat men naast het Spaans ook 22 Maya-talen spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men naast het Spaans ook 22 Maya-talen spreekt."
      },
      {
        question: "Welk houten percussie-instrument wordt met stokken bespeeld?",
        answer: "De marimba",
        explanation: "Het antwoord is De marimba; dit beantwoordt de vraag: Welk houten percussie-instrument wordt met stokken bespeeld?"
      },
      {
        question: "Wat voor traditioneel gerecht is pepián?",
        answer: "Een hartige Maya-stoofpot van geroosterde zaden en vlees",
        explanation: "Het antwoord is Een hartige Maya-stoofpot van geroosterde zaden en vlees; dit beantwoordt de vraag: Wat voor traditioneel gerecht is pepián?"
      },
      {
        question: "Waarmee maakt men prachtige, versierde tapijten op straat voor Pasen?",
        answer: "Met gekleurd zaagsel en bloemen",
        explanation: "Het antwoord is Met gekleurd zaagsel en bloemen; dit beantwoordt de vraag: Waarmee maakt men prachtige, versierde tapijten op straat voor Pasen?"
      },
      {
        question: "Welke felgekleurde vogel met een lange staart is het symbool en de munt van het land?",
        answer: "De quetzal",
        explanation: "Het antwoord is De quetzal; dit beantwoordt de vraag: Welke felgekleurde vogel met een lange staart is het symbool en de munt van het land?"
      },
      {
        question: "Hoe heet het prachtige bergmeer omringd door vulkanen?",
        answer: "Het Meer van Atitlán",
        explanation: "Het antwoord is Het Meer van Atitlán; dit beantwoordt de vraag: Hoe heet het prachtige bergmeer omringd door vulkanen?"
      }
    ]
  },
  HTI: {
    name: "Haïti",
    questions: [
      {
        question: "Welke twee officiële talen heeft Haïti?",
        answer: "Haïtiaans Creools en Frans",
        explanation: "Het antwoord is Haïtiaans Creools en Frans; dit beantwoordt de vraag: Welke twee officiële talen heeft Haïti?"
      },
      {
        question: "Hoe heet de bekende Haïtiaanse dansmuziekstijl?",
        answer: "Compas",
        explanation: "Het antwoord is Compas; aanvullende uitleg: of Konpa."
      },
      {
        question: "Wat voor populair gerecht is griot?",
        answer: "Gefrituurd gekruid varkensvlees geserveerd met pikante koolsalade",
        explanation: "Het antwoord is Gefrituurd gekruid varkensvlees geserveerd met pikante koolsalade; dit beantwoordt de vraag: Wat voor populair gerecht is griot?"
      },
      {
        question: "In welk jaar werd Haïti de eerste onafhankelijke zwarte republiek?",
        answer: "In 1804",
        explanation: "Het antwoord is In 1804; dit beantwoordt de vraag: In welk jaar werd Haïti de eerste onafhankelijke zwarte republiek?"
      },
      {
        question: "Hoe heet het reusachtige stenen bergfort op de bergtop?",
        answer: "Citadelle Laferrière",
        explanation: "Het antwoord is Citadelle Laferrière; dit beantwoordt de vraag: Hoe heet het reusachtige stenen bergfort op de bergtop?"
      },
      {
        question: "Klopt het dat Haïti het eiland Hispaniola deelt met de Dominikaanse Republiek?",
        answer: "Waar",
        explanation: "De bewering is waar: Haïti het eiland Hispaniola deelt met de Dominikaanse Republiek."
      }
    ]
  },
  HND: {
    name: "Honduras",
    questions: [
      {
        question: "Wat is de officiële taal in Honduras?",
        answer: "Spaans",
        explanation: "Het antwoord is Spaans; dit beantwoordt de vraag: Wat is de officiële taal in Honduras?"
      },
      {
        question: "Klopt het dat mensen dansen op de trommelritmes van de Garifuna?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen dansen op de trommelritmes van de Garifuna."
      },
      {
        question: "Wat voor gerecht is een baleada?",
        answer: "Een opgevouwen maïstortilla gevuld met bonen, kaas en ei",
        explanation: "Het antwoord is Een opgevouwen maïstortilla gevuld met bonen, kaas en ei; dit beantwoordt de vraag: Wat voor gerecht is een baleada?"
      },
      {
        question: "Welke oude historische Maya-stad met stenen beelden staat in Honduras?",
        answer: "Copán",
        explanation: "Het antwoord is Copán; dit beantwoordt de vraag: Welke oude historische Maya-stad met stenen beelden staat in Honduras?"
      },
      {
        question: "Met welke reusachtige vissen kun je duiken bij de Baai-eilanden?",
        answer: "Walvishaaien",
        explanation: "Het antwoord is Walvishaaien; dit beantwoordt de vraag: Met welke reusachtige vissen kun je duiken bij de Baai-eilanden?"
      },
      {
        question: "Wat is de hoofdstad van Honduras?",
        answer: "Tegucigalpa",
        explanation: "Het antwoord is Tegucigalpa; dit beantwoordt de vraag: Wat is de hoofdstad van Honduras?"
      }
    ]
  },
  NIC: {
    name: "Nicaragua",
    questions: [
      {
        question: "Wat is de officiële taal van Nicaragua?",
        answer: "Spaans",
        explanation: "Het antwoord is Spaans; dit beantwoordt de vraag: Wat is de officiële taal van Nicaragua?"
      },
      {
        question: "Klopt het dat men op het platteland de marimba op schoot bespeelt?",
        answer: "Waar",
        explanation: "De bewering is waar: men op het platteland de marimba op schoot bespeelt."
      },
      {
        question: "Wat voor gerecht is een nacatamal?",
        answer: "Een pakketje van deeg, vlees en groenten gestoomd in bananenblad",
        explanation: "Het antwoord is Een pakketje van deeg, vlees en groenten gestoomd in bananenblad; dit beantwoordt de vraag: Wat voor gerecht is een nacatamal?"
      },
      {
        question: "Hoe heet het traditionele, satirische straattheaterstuk?",
        answer: "El Güegüense",
        explanation: "Het antwoord is El Güegüense; dit beantwoordt de vraag: Hoe heet het traditionele, satirische straattheaterstuk?"
      },
      {
        question: "Hoe heet het grote eiland met twee vulkanen midden in het meer?",
        answer: "Ometepe",
        explanation: "Het antwoord is Ometepe; dit beantwoordt de vraag: Hoe heet het grote eiland met twee vulkanen midden in het meer?"
      },
      {
        question: "Klopt het dat Nicaragua qua oppervlakte het grootste land van Midden-Amerika is?",
        answer: "Waar",
        explanation: "De bewering is waar: Nicaragua qua oppervlakte het grootste land van Midden-Amerika is."
      }
    ]
  },
  PAN: {
    name: "Panama",
    questions: [
      {
        question: "Wat is de officiële taal in Panama?",
        answer: "Spaans",
        explanation: "Het antwoord is Spaans; dit beantwoordt de vraag: Wat is de officiële taal in Panama?"
      },
      {
        question: "Welk instrument hoor je veel in de Típico volksmuziek?",
        answer: "De accordeon",
        explanation: "Het antwoord is De accordeon; dit beantwoordt de vraag: Welk instrument hoor je veel in de Típico volksmuziek?"
      },
      {
        question: "Wat voor gerecht is sancocho?",
        answer: "Een traditionele rijke kippensoep met yuca en maïs",
        explanation: "Het antwoord is Een traditionele rijke kippensoep met yuca en maïs; dit beantwoordt de vraag: Wat voor gerecht is sancocho?"
      },
      {
        question: "Hoe noemt men de bont beschilderde oude bussen in de stad?",
        answer: "Diablos Rojos",
        explanation: "Het antwoord is Diablos Rojos; aanvullende uitleg: Rode Duivels."
      },
      {
        question: "Welke twee grote oceanen worden door het Panamakanaal verbonden?",
        answer: "De Atlantische Oceaan en de Stille Oceaan",
        explanation: "Het antwoord is De Atlantische Oceaan en de Stille Oceaan; dit beantwoordt de vraag: Welke twee grote oceanen worden door het Panamakanaal verbonden?"
      },
      {
        question: "Klopt het dat de beroemde Panamahoed oorspronkelijk uit Panama komt?",
        answer: "Niet waar",
        explanation: "De bewering is onjuist; de toelichting is: de hoed komt oorspronkelijk uit Ecuador."
      }
    ]
  },
  KNA: {
    name: "Saint Kitts en Nevis",
    questions: [
      {
        question: "Wat is de officiële taal van Saint Kitts en Nevis?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van Saint Kitts en Nevis?"
      },
      {
        question: "Klopt het dat muziekbands tijdens het festival Sugar Mas op olievaten spelen?",
        answer: "Waar",
        explanation: "De bewering is waar: muziekbands tijdens het festival Sugar Mas op olievaten spelen."
      },
      {
        question: "Klopt het dat men gezouten vis met dumplings en weegbree eet?",
        answer: "Waar",
        explanation: "De bewering is waar: men gezouten vis met dumplings en weegbree eet."
      },
      {
        question: "Klopt het dat men rond de kerstperiode feest viert met parades?",
        answer: "Waar",
        explanation: "De bewering is waar: men rond de kerstperiode feest viert met parades."
      },
      {
        question: "Hoe heet het historische Britse fort op de heuvel?",
        answer: "Brimstone Hill Fortress",
        explanation: "Het antwoord is Brimstone Hill Fortress; dit beantwoordt de vraag: Hoe heet het historische Britse fort op de heuvel?"
      },
      {
        question: "Klopt het dat dit de kleinste onafhankelijke staat van heel Amerika is?",
        answer: "Waar",
        explanation: "De bewering is waar: dit de kleinste onafhankelijke staat van heel Amerika is."
      }
    ]
  },
  LCA: {
    name: "Saint Lucia",
    questions: [
      {
        question: "Wat is de officiële taal van Saint Lucia?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van Saint Lucia?"
      },
      {
        question: "Klopt het dat men op het eiland van vrolijke socamuziek houdt?",
        answer: "Waar",
        explanation: "De bewering is waar: men op het eiland van vrolijke socamuziek houdt."
      },
      {
        question: "Wat is het nationale gerecht bereid met groene bananen?",
        answer: "Gekookte groene banaan met gezouten kabeljauw",
        explanation: "Het antwoord is Gekookte groene banaan met gezouten kabeljauw; dit beantwoordt de vraag: Wat is het nationale gerecht bereid met groene bananen?"
      },
      {
        question: "Welk internationaal muziekfestival trekt jaarlijks duizenden bezoekers?",
        answer: "Het Saint Lucia Jazz Festival",
        explanation: "Het antwoord is Het Saint Lucia Jazz Festival; dit beantwoordt de vraag: Welk internationaal muziekfestival trekt jaarlijks duizenden bezoekers?"
      },
      {
        question: "Hoe heten de twee beroemde steile groene vulkaanpieken aan zee?",
        answer: "De Pitons",
        explanation: "Het antwoord is De Pitons; aanvullende uitleg: Gros Piton en Petit Piton."
      },
      {
        question: "Klopt het dat Saint Lucia het enige land is dat naar een historische vrouw is vernoemd?",
        answer: "Waar",
        explanation: "De bewering is waar: Saint Lucia het enige land is dat naar een historische vrouw is vernoemd."
      }
    ]
  },
  VCT: {
    name: "Saint Vincent en de Grenadines",
    questions: [
      {
        question: "Wat is de officiële taal van Saint Vincent en de Grenadines?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van Saint Vincent en de Grenadines?"
      },
      {
        question: "Klopt het dat muzikanten bij feestelijkheden op olievattrommels spelen?",
        answer: "Waar",
        explanation: "De bewering is waar: muzikanten bij feestelijkheden op olievattrommels spelen."
      },
      {
        question: "Hoe bereidt men de broodvrucht in het nationale gerecht?",
        answer: "Geroosterd over open vuur en geserveerd met gebakken vis",
        explanation: "Het antwoord is Geroosterd over open vuur en geserveerd met gebakken vis; dit beantwoordt de vraag: Hoe bereidt men de broodvrucht in het nationale gerecht?"
      },
      {
        question: "Hoe heet het Caribische zomercarnaval op de eilanden?",
        answer: "Vincy Mas",
        explanation: "Het antwoord is Vincy Mas; dit beantwoordt de vraag: Hoe heet het Caribische zomercarnaval op de eilanden?"
      },
      {
        question: "Hoe heet de actieve vulkaan op het hoofdeiland Saint Vincent?",
        answer: "La Soufrière",
        explanation: "Het antwoord is La Soufrière; dit beantwoordt de vraag: Hoe heet de actieve vulkaan op het hoofdeiland Saint Vincent?"
      },
      {
        question: "Uit hoeveel eilandjes bestaat het land ongeveer (3 of meer dan 30)?",
        answer: "32 tropische eilandjes",
        explanation: "Het antwoord is 32 tropische eilandjes; dit beantwoordt de vraag: Uit hoeveel eilandjes bestaat het land ongeveer (3 of meer dan 30)?"
      }
    ]
  },
  TTO: {
    name: "Trinidad en Tobago",
    questions: [
      {
        question: "Wat is de officiële taal van Trinidad en Tobago?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van Trinidad en Tobago?"
      },
      {
        question: "Welk muziekinstrument gemaakt van stalen olievaten is hier uitgevonden?",
        answer: "De Steelpan",
        explanation: "Het antwoord is De Steelpan; aanvullende uitleg: Steeldrum."
      },
      {
        question: "Wat voor populair straatvoedsel is doubles?",
        answer: "Gefrituurde platbroodjes gevuld met kerrie-kikkererwten",
        explanation: "Het antwoord is Gefrituurde platbroodjes gevuld met kerrie-kikkererwten; dit beantwoordt de vraag: Wat voor populair straatvoedsel is doubles?"
      },
      {
        question: "In welke hoofdstad viert men een van de grootste carnavals ter wereld?",
        answer: "Port of Spain",
        explanation: "Het antwoord is Port of Spain; dit beantwoordt de vraag: In welke hoofdstad viert men een van de grootste carnavals ter wereld?"
      },
      {
        question: "Hoe heet het reusachtige natuurlijke meer dat uit asfalt bestaat?",
        answer: "Pitch Lake",
        explanation: "Het antwoord is Pitch Lake; dit beantwoordt de vraag: Hoe heet het reusachtige natuurlijke meer dat uit asfalt bestaat?"
      },
      {
        question: "Welke felrode vogel is de nationale vogel van Trinidad?",
        answer: "De Rode Ibis",
        explanation: "Het antwoord is De Rode Ibis; dit beantwoordt de vraag: Welke felrode vogel is de nationale vogel van Trinidad?"
      }
    ]
  },
  BRA: {
    name: "Brazilië",
    questions: [
      {
        question: "Wat is de officiële taal van Brazilië?",
        answer: "Portugees",
        explanation: "Het antwoord is Portugees; dit beantwoordt de vraag: Wat is de officiële taal van Brazilië?"
      },
      {
        question: "Welke twee beroemde muziek- en dansstijlen zijn in Brazilië ontstaan?",
        answer: "Samba en Bossa Nova",
        explanation: "Het antwoord is Samba en Bossa Nova; dit beantwoordt de vraag: Welke twee beroemde muziek- en dansstijlen zijn in Brazilië ontstaan?"
      },
      {
        question: "Wat voor nationaal gerecht is feijoada?",
        answer: "Een stoofpot",
        explanation: "Feijoada wordt gemaakt met zwarte bonen en verschillende soorten varkensvlees."
      },
      {
        question: "In welke stad trekt het allergrootste Carnaval ter wereld door de straten?",
        answer: "Rio de Janeiro",
        explanation: "Het antwoord is Rio de Janeiro; dit beantwoordt de vraag: In welke stad trekt het allergrootste Carnaval ter wereld door de straten?"
      },
      {
        question: "Welke reusachtige rivier stroomt door het regenwoud van Brazilië?",
        answer: "De Amazone-rivier",
        explanation: "Het antwoord is De Amazone-rivier; dit beantwoordt de vraag: Welke reusachtige rivier stroomt door het regenwoud van Brazilië?"
      },
      {
        question: "Hoe heet het beroemde grote standbeeld van Jezus op de berg Corcovado?",
        answer: "Christus de Verlosser",
        explanation: "Het antwoord is Christus de Verlosser; aanvullende uitleg: Cristo Redentor."
      }
    ]
  },
  ARG: {
    name: "Argentinië",
    questions: [
      {
        question: "Hoe noemen Argentijnen informeel hun vrienden in de spreektaal?",
        answer: "Che",
        explanation: "Het antwoord is Che; aanvullende uitleg: zoals Che Guevara."
      },
      {
        question: "Welke hartstochtelijke en passievolle dans is ontstaan in Buenos Aires?",
        answer: "De Tango",
        explanation: "Het antwoord is De Tango; dit beantwoordt de vraag: Welke hartstochtelijke en passievolle dans is ontstaan in Buenos Aires?"
      },
      {
        question: "Hoe noemt men de traditionele Argentijnse barbecue op open vuur?",
        answer: "Een asado",
        explanation: "Het antwoord is Een asado; dit beantwoordt de vraag: Hoe noemt men de traditionele Argentijnse barbecue op open vuur?"
      },
      {
        question: "Hoe heet de oppeppende kruidenthee die men drinkt met een metalen rietje (Bombilla)?",
        answer: "Mate",
        explanation: "Het antwoord is Mate; dit beantwoordt de vraag: Hoe heet de oppeppende kruidenthee die men drinkt met een metalen rietje (Bombilla)?"
      },
      {
        question: "Hoe heet de ruige, koude regio in het uiterste zuiden vol gletsjers?",
        answer: "Patagonië",
        explanation: "Het antwoord is Patagonië; dit beantwoordt de vraag: Hoe heet de ruige, koude regio in het uiterste zuiden vol gletsjers?"
      },
      {
        question: "Uit welk land kwam paus Franciscus?",
        answer: "Argentinië",
        explanation: "Het antwoord is Argentinië; dit beantwoordt de vraag: Uit welk land kwam paus Franciscus?"
      }
    ]
  },
  PER: {
    name: "Peru",
    questions: [
      {
        question: "Welke inheemse Inca-taal wordt naast het Spaans veel gesproken?",
        answer: "Quechua",
        explanation: "Het antwoord is Quechua; dit beantwoordt de vraag: Welke inheemse Inca-taal wordt naast het Spaans veel gesproken?"
      },
      {
        question: "Welk traditioneel houten of rieten instrument hoor je veel in de Andesmuziek?",
        answer: "De panfluit",
        explanation: "Het antwoord is De panfluit; aanvullende uitleg: zampoña."
      },
      {
        question: "Wat voor nationaal gerecht is ceviche?",
        answer: "Rauwe verse vis gemarineerd en ’gegaard’ in frisse limoensap",
        explanation: "Het antwoord is Rauwe verse vis gemarineerd en ’gegaard’ in frisse limoensap; dit beantwoordt de vraag: Wat voor nationaal gerecht is ceviche?"
      },
      {
        question: "Hoe heet de mystieke oude Inca-stad verborgen hoog in de bergen?",
        answer: "Machu Picchu",
        explanation: "Het antwoord is Machu Picchu; dit beantwoordt de vraag: Hoe heet de mystieke oude Inca-stad verborgen hoog in de bergen?"
      },
      {
        question: "Welk hoefdier dat zachte wol levert leeft veel in de Peruaanse Andes?",
        answer: "De alpaca",
        explanation: "Het antwoord is De alpaca; aanvullende uitleg: en de lama."
      },
      {
        question: "Hoe heet het hoogste bevaarbare meer ter wereld, op de grens met Bolivia?",
        answer: "Het Titicacameer",
        explanation: "Het antwoord is Het Titicacameer; dit beantwoordt de vraag: Hoe heet het hoogste bevaarbare meer ter wereld, op de grens met Bolivia?"
      }
    ]
  },
  COL: {
    name: "Colombia",
    questions: [
      {
        question: "Wat is de officiële taal van Colombia?",
        answer: "Spaans",
        explanation: "Het antwoord is Spaans; dit beantwoordt de vraag: Wat is de officiële taal van Colombia?"
      },
      {
        question: "Welke vrolijke volksmuziek met accordeon en trommels is ontzettend populair?",
        answer: "Vallenato",
        explanation: "Het antwoord is Vallenato; aanvullende uitleg: en Cumbia."
      },
      {
        question: "Wat voor gerecht zijn arepas?",
        answer: "Ronde dikke maïskoekjes die je belegt met kaas of vlees",
        explanation: "Het antwoord is Ronde dikke maïskoekjes die je belegt met kaas of vlees; dit beantwoordt de vraag: Wat voor gerecht zijn arepas?"
      },
      {
        question: "In welke Colombiaanse stad vindt het beroemde jaarlijkse Bloemenfestival plaats?",
        answer: "Medellín",
        explanation: "Het antwoord is Medellín; dit beantwoordt de vraag: In welke Colombiaanse stad vindt het beroemde jaarlijkse Bloemenfestival plaats?"
      },
      {
        question: "Welke bijzondere, heel hoge palmen groeien in de Cocoravallei?",
        answer: "De waspalm",
        explanation: "Het antwoord is De waspalm; aanvullende uitleg: de hoogste palmen ter wereld."
      },
      {
        question: "Om welke lekkere drank en snijbloemen staat Colombia wereldwijd bekend?",
        answer: "Koffie",
        explanation: "Het antwoord is Koffie; aanvullende uitleg: Arabica-koffie."
      }
    ]
  },
  CHL: {
    name: "Chili",
    questions: [
      {
        question: "Wat is de officiële taal van het langgerekte land Chili?",
        answer: "Spaans",
        explanation: "Het antwoord is Spaans; dit beantwoordt de vraag: Wat is de officiële taal van het langgerekte land Chili?"
      },
      {
        question: "Welke traditionele nationale dans beeldt de hofmakerij van een haan uit?",
        answer: "De Cueca",
        explanation: "Het antwoord is De Cueca; dit beantwoordt de vraag: Welke traditionele nationale dans beeldt de hofmakerij van een haan uit?"
      },
      {
        question: "Wat voor ovengerecht is pastel de choclo?",
        answer: "Een hartige maïsstoofschotel gevuld met gehakt en ei",
        explanation: "Het antwoord is Een hartige maïsstoofschotel gevuld met gehakt en ei; dit beantwoordt de vraag: Wat voor ovengerecht is pastel de choclo?"
      },
      {
        question: "Op welke datum vieren Chilenen hun nationale feestdag Dieciocho?",
        answer: "18 september",
        explanation: "Het antwoord is 18 september; dit beantwoordt de vraag: Op welke datum vieren Chilenen hun nationale feestdag Dieciocho?"
      },
      {
        question: "Hoe heet de kurkdroge woestijn in het noorden van Chili?",
        answer: "De Atacama-woestijn",
        explanation: "Het antwoord is De Atacama-woestijn; dit beantwoordt de vraag: Hoe heet de kurkdroge woestijn in het noorden van Chili?"
      },
      {
        question: "Hoe heet het eiland in de oceaan dat bij Chili hoort en vol reusachtige stenen beelden staat?",
        answer: "Paaseiland",
        explanation: "Het antwoord is Paaseiland; aanvullende uitleg: Rapa Nui."
      }
    ]
  },
  BOL: {
    name: "Bolivia",
    questions: [
      {
        question: "Klopt het dat er in Bolivia naast Spaans ook inheemse talen worden erkend?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: 36 inheemse talen."
      },
      {
        question: "Van welk dier maakte men vroeger de klankkast van het gitaartje charango?",
        answer: "Van het schild van een gordeldier",
        explanation: "Het antwoord is Van het schild van een gordeldier; dit beantwoordt de vraag: Van welk dier maakte men vroeger de klankkast van het gitaartje charango?"
      },
      {
        question: "Wat voor gevulde, hartige deegbroodjes koopt men op straat?",
        answer: "Salteñas",
        explanation: "Het antwoord is Salteñas; dit beantwoordt de vraag: Wat voor gevulde, hartige deegbroodjes koopt men op straat?"
      },
      {
        question: "In welke stad vindt het beroemde Carnaval met duivelsmaskers plaats?",
        answer: "Oruro",
        explanation: "Het antwoord is Oruro; dit beantwoordt de vraag: In welke stad vindt het beroemde Carnaval met duivelsmaskers plaats?"
      },
      {
        question: "Hoe heet ’s werelds allergrootste spiegelgladde zoutvlakte?",
        answer: "Salar de Uyuni",
        explanation: "Het antwoord is Salar de Uyuni; dit beantwoordt de vraag: Hoe heet ’s werelds allergrootste spiegelgladde zoutvlakte?"
      },
      {
        question: "Welke twee steden delen de titel van hoofdstad in Bolivia?",
        answer: "La Paz en Sucre",
        explanation: "Het antwoord is La Paz en Sucre; dit beantwoordt de vraag: Welke twee steden delen de titel van hoofdstad in Bolivia?"
      }
    ]
  },
  ECU: {
    name: "Ecuador",
    questions: [
      {
        question: "Wat is de officiële taal van Ecuador?",
        answer: "Spaans",
        explanation: "Het antwoord is Spaans; dit beantwoordt de vraag: Wat is de officiële taal van Ecuador?"
      },
      {
        question: "Klopt het dat mensen in de bergen graag naar melancholische pasillomuziek luisteren?",
        answer: "Waar",
        explanation: "De bewering is waar: mensen in de bergen graag naar melancholische pasillomuziek luisteren."
      },
      {
        question: "Wat voor populaire soep is encebollado?",
        answer: "Een hartige vis- en tonijnsoep bereid met yuca en uien",
        explanation: "Het antwoord is Een hartige vis- en tonijnsoep bereid met yuca en uien; dit beantwoordt de vraag: Wat voor populaire soep is encebollado?"
      },
      {
        question: "Welk eeuwenoud Inca-zonnefeest viert men in juni?",
        answer: "Inti Raymi",
        explanation: "Het antwoord is Inti Raymi; dit beantwoordt de vraag: Welk eeuwenoud Inca-zonnefeest viert men in juni?"
      },
      {
        question: "Welke beroemde eilandengroep vol unieke dieren hoort bij Ecuador?",
        answer: "De Galápagoseilanden",
        explanation: "Het antwoord is De Galápagoseilanden; dit beantwoordt de vraag: Welke beroemde eilandengroep vol unieke dieren hoort bij Ecuador?"
      },
      {
        question: "Naar welke geografische, denkbeeldige lijn is het land vernoemd?",
        answer: "De Evenaar",
        explanation: "Het antwoord is De Evenaar; aanvullende uitleg: Ecuador betekent Evenaar."
      }
    ]
  },
  GUY: {
    name: "Guyana",
    questions: [
      {
        question: "Welke officiële taal heeft Guyana, als enig land op het Zuid-Amerikaanse vasteland?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Welke officiële taal heeft Guyana, als enig land op het Zuid-Amerikaanse vasteland?"
      },
      {
        question: "Welke muziekstijl mixt Indiase en Caraïbische ritmes?",
        answer: "Chutney-Soca",
        explanation: "Het antwoord is Chutney-Soca; dit beantwoordt de vraag: Welke muziekstijl mixt Indiase en Caraïbische ritmes?"
      },
      {
        question: "Wat voor traditioneel stoofgerecht is pepperpot?",
        answer: "Een inheems stoofgerecht",
        explanation: "Pepperpot wordt bereid met donker, gefermenteerd cassavesap."
      },
      {
        question: "Hoe heet het nationale feest op de dag van de Republiek?",
        answer: "Mashramani",
        explanation: "Het antwoord is Mashramani; dit beantwoordt de vraag: Hoe heet het nationale feest op de dag van de Republiek?"
      },
      {
        question: "Hoe heet de indrukwekkende, reusachtige waterval in de jungle?",
        answer: "De Kaieteur-waterval",
        explanation: "Het antwoord is De Kaieteur-waterval; dit beantwoordt de vraag: Hoe heet de indrukwekkende, reusachtige waterval in de jungle?"
      },
      {
        question: "Wat is de hoofdstad van Guyana?",
        answer: "Georgetown",
        explanation: "Het antwoord is Georgetown; dit beantwoordt de vraag: Wat is de hoofdstad van Guyana?"
      }
    ]
  },
  PRY: {
    name: "Paraguay",
    questions: [
      {
        question: "Welke inheemse taal wordt door vrijwel iedereen gesproken naast Spaans?",
        answer: "Guaraní",
        explanation: "Het antwoord is Guaraní; dit beantwoordt de vraag: Welke inheemse taal wordt door vrijwel iedereen gesproken naast Spaans?"
      },
      {
        question: "Welk instrument zonder frets wordt in Paraguay virtuoos bespeeld?",
        answer: "De Paraguayaanse harp",
        explanation: "Het antwoord is De Paraguayaanse harp; dit beantwoordt de vraag: Welk instrument zonder frets wordt in Paraguay virtuoos bespeeld?"
      },
      {
        question: "Wat voor bijzonder gerecht is sopa paraguaya?",
        answer: "Een gebakken hartige maïscake met kaas en uien",
        explanation: "Het antwoord is Een gebakken hartige maïscake met kaas en uien; aanvullende uitleg: geen vloeibare soep!."
      },
      {
        question: "Hoe heet de ijskoude kruidenthee die iedereen op straat drinkt?",
        answer: "Tereré",
        explanation: "Het antwoord is Tereré; dit beantwoordt de vraag: Hoe heet de ijskoude kruidenthee die iedereen op straat drinkt?"
      },
      {
        question: "Hoe heet de grote droge wildernisregio in het westen van Paraguay?",
        answer: "De Gran Chaco",
        explanation: "Het antwoord is De Gran Chaco; dit beantwoordt de vraag: Hoe heet de grote droge wildernisregio in het westen van Paraguay?"
      },
      {
        question: "Wat is de hoofdstad van Paraguay?",
        answer: "Asunción",
        explanation: "Het antwoord is Asunción; dit beantwoordt de vraag: Wat is de hoofdstad van Paraguay?"
      }
    ]
  },
  SUR: {
    name: "Suriname",
    questions: [
      {
        question: "Wat is de officiële landstaal van Suriname?",
        answer: "Nederlands",
        explanation: "Het antwoord is Nederlands; dit beantwoordt de vraag: Wat is de officiële landstaal van Suriname?"
      },
      {
        question: "Welke vrolijke Surinaamse dansmuziek heeft koperblazers en slagwerk?",
        answer: "Kaseko",
        explanation: "Het antwoord is Kaseko; dit beantwoordt de vraag: Welke vrolijke Surinaamse dansmuziek heeft koperblazers en slagwerk?"
      },
      {
        question: "Wat voor platbrood eet men traditioneel bij kerriekip en kouseband?",
        answer: "Roti",
        explanation: "Het antwoord is Roti; dit beantwoordt de vraag: Wat voor platbrood eet men traditioneel bij kerriekip en kouseband?"
      },
      {
        question: "Op welke datum viert men Keti Koti (afschaffing van de slavernij)?",
        answer: "1 juli",
        explanation: "Het antwoord is 1 juli; dit beantwoordt de vraag: Op welke datum viert men Keti Koti (afschaffing van de slavernij)?"
      },
      {
        question: "Hoeveel procent van Suriname bestaat ongeveer uit maagdelijk tropisch regenwoud?",
        answer: "Ruim 90% van het landoppervlak",
        explanation: "Het antwoord is Ruim 90% van het landoppervlak; dit beantwoordt de vraag: Hoeveel procent van Suriname bestaat ongeveer uit maagdelijk tropisch regenwoud?"
      },
      {
        question: "Wat is de houten hoofdstad van Suriname aan de rivier?",
        answer: "Paramaribo",
        explanation: "Het antwoord is Paramaribo; dit beantwoordt de vraag: Wat is de houten hoofdstad van Suriname aan de rivier?"
      }
    ]
  },
  URY: {
    name: "Uruguay",
    questions: [
      {
        question: "Wat is de officiële taal van Uruguay?",
        answer: "Spaans",
        explanation: "Het antwoord is Spaans; dit beantwoordt de vraag: Wat is de officiële taal van Uruguay?"
      },
      {
        question: "Hoe heet de traditionele meeslepende trommelmuziek op straat?",
        answer: "Candombe",
        explanation: "Het antwoord is Candombe; dit beantwoordt de vraag: Hoe heet de traditionele meeslepende trommelmuziek op straat?"
      },
      {
        question: "Wat voor reusachtig nationaal gerecht is chivito?",
        answer: "Een rijke biefstuk-sandwich met ham, kaas, ei en mayonaise",
        explanation: "Het antwoord is Een rijke biefstuk-sandwich met ham, kaas, ei en mayonaise; dit beantwoordt de vraag: Wat voor reusachtig nationaal gerecht is chivito?"
      },
      {
        question: "Hoeveel dagen duurt het lange kleurrijke carnaval van Montevideo?",
        answer: "Meer dan 40 dagen",
        explanation: "Het antwoord is Meer dan 40 dagen; aanvullende uitleg: het langste carnaval ter wereld."
      },
      {
        question: "Welk is het grootste knaagdier ter wereld dat in het wild in Uruguay leeft?",
        answer: "De capibara",
        explanation: "Het antwoord is De capibara; dit beantwoordt de vraag: Welk is het grootste knaagdier ter wereld dat in het wild in Uruguay leeft?"
      },
      {
        question: "Wat is de hoofdstad van Uruguay?",
        answer: "Montevideo",
        explanation: "Het antwoord is Montevideo; dit beantwoordt de vraag: Wat is de hoofdstad van Uruguay?"
      }
    ]
  },
  VEN: {
    name: "Venezuela",
    questions: [
      {
        question: "Wat is de officiële taal van Venezuela?",
        answer: "Spaans",
        explanation: "Het antwoord is Spaans; dit beantwoordt de vraag: Wat is de officiële taal van Venezuela?"
      },
      {
        question: "Welke instrumenten begeleiden de joropomuziek op de vlaktes?",
        answer: "Harp, viersnarige gitaar en maracas",
        explanation: "De viersnarige gitaar heet een cuatro."
      },
      {
        question: "Wat zit er in het nationale gerecht Pabellón Criollo?",
        answer: "Rijst, zwarte bonen, geplozen rundvlees en gebakken banaan",
        explanation: "Het antwoord is Rijst, zwarte bonen, geplozen rundvlees en gebakken banaan; dit beantwoordt de vraag: Wat zit er in het nationale gerecht Pabellón Criollo?"
      },
      {
        question: "Hoe noemen de dansers zich die in rode pakken met maskers dansen?",
        answer: "De Dansende Duivels van Yare",
        explanation: "Het antwoord is De Dansende Duivels van Yare; aanvullende uitleg: Diablos Danzantes."
      },
      {
        question: "Hoe heet ’s werelds hoogste vrije waterval, die in Venezuela ligt?",
        answer: "Angel Falls",
        explanation: "Het antwoord is Angel Falls; aanvullende uitleg: Salto Ángel."
      },
      {
        question: "Wat is de hoofdstad van Venezuela?",
        answer: "Caracas",
        explanation: "Het antwoord is Caracas; dit beantwoordt de vraag: Wat is de hoofdstad van Venezuela?"
      }
    ]
  },
  AUS: {
    name: "Australië",
    questions: [
      {
        question: "Welk informeel Engels woord gebruikt een Australiër voor een goede vriend?",
        answer: "Mate",
        explanation: "Het antwoord is Mate; aanvullende uitleg: G’day mate!."
      },
      {
        question: "Hoe heet het traditionele houten blaasinstrument van de Aboriginals?",
        answer: "De didgeridoo",
        explanation: "Het antwoord is De didgeridoo; dit beantwoordt de vraag: Hoe heet het traditionele houten blaasinstrument van de Aboriginals?"
      },
      {
        question: "Wat voor broodbeleg is vegemite?",
        answer: "Een donkerbruin zoutig gistextract",
        explanation: "Het antwoord is Een donkerbruin zoutig gistextract; dit beantwoordt de vraag: Wat voor broodbeleg is vegemite?"
      },
      {
        question: "Hoe noemen Australiërs hun informele barbecue in het weekend?",
        answer: "Een barbie",
        explanation: "Het antwoord is Een barbie; aanvullende uitleg: BBQ."
      },
      {
        question: "Hoe heet ’s werelds grootste koraalrif voor de noordoostkust?",
        answer: "Het Great Barrier Reef",
        explanation: "Het antwoord is Het Great Barrier Reef; dit beantwoordt de vraag: Hoe heet ’s werelds grootste koraalrif voor de noordoostkust?"
      },
      {
        question: "Welke twee bekende dieren staan afgebeeld op het staatswapen?",
        answer: "De Kangoeroe en de Emoe",
        explanation: "Het antwoord is De Kangoeroe en de Emoe; dit beantwoordt de vraag: Welke twee bekende dieren staan afgebeeld op het staatswapen?"
      }
    ]
  },
  NZL: {
    name: "Nieuw-Zeeland",
    questions: [
      {
        question: "Welke inheemse taal is naast het Engels een officiële taal?",
        answer: "Māori",
        explanation: "Het antwoord is Māori; dit beantwoordt de vraag: Welke inheemse taal is naast het Engels een officiële taal?"
      },
      {
        question: "Hoe heet de indrukwekkende, traditionele Māori-uitdagingsdans van het nationale rugbyteam?",
        answer: "De haka",
        explanation: "Het antwoord is De haka; dit beantwoordt de vraag: Hoe heet de indrukwekkende, traditionele Māori-uitdagingsdans van het nationale rugbyteam?"
      },
      {
        question: "Hoe noemt men de maaltijd die in een hete, ondergrondse oven wordt gegaard?",
        answer: "Hāngī",
        explanation: "Het antwoord is Hāngī; dit beantwoordt de vraag: Hoe noemt men de maaltijd die in een hete, ondergrondse oven wordt gegaard?"
      },
      {
        question: "Welke bijnaam hebben de inwoners van Nieuw-Zeeland gekregen?",
        answer: "Kiwi’s",
        explanation: "Het antwoord is Kiwi’s; dit beantwoordt de vraag: Welke bijnaam hebben de inwoners van Nieuw-Zeeland gekregen?"
      },
      {
        question: "Welke nachtelijke loopvogel met een lange snavel is het nationale symbool?",
        answer: "De kiwi",
        explanation: "Het antwoord is De kiwi; dit beantwoordt de vraag: Welke nachtelijke loopvogel met een lange snavel is het nationale symbool?"
      },
      {
        question: "Welke beroemde filmtrilogie werd in het prachtige landschap opgenomen?",
        answer: "The Lord of the Rings",
        explanation: "Het antwoord is The Lord of the Rings; dit beantwoordt de vraag: Welke beroemde filmtrilogie werd in het prachtige landschap opgenomen?"
      }
    ]
  },
  FJI: {
    name: "Fiji",
    questions: [
      {
        question: "Welk woord gebruikt iedereen op Fiji om je te verwelkomen?",
        answer: "Bula!",
        explanation: "Het antwoord is Bula!; dit beantwoordt de vraag: Welk woord gebruikt iedereen op Fiji om je te verwelkomen?"
      },
      {
        question: "Klopt het dat bewoners traditionele groepsdansen met waaiers of speren uitvoeren?",
        answer: "Waar",
        explanation: "De bewering is juist; de toelichting is: Meke-dans."
      },
      {
        question: "Wat voor eilandgerecht is kokoda?",
        answer: "Rauwe vis gemarineerd in frisse kokosmelk en limoensap",
        explanation: "Het antwoord is Rauwe vis gemarineerd in frisse kokosmelk en limoensap; dit beantwoordt de vraag: Wat voor eilandgerecht is kokoda?"
      },
      {
        question: "Uit welk natuurlijk materiaal drinkt men het traditionele drankje kava?",
        answer: "Uit een halve kokosnoot",
        explanation: "Het antwoord is Uit een halve kokosnoot; dit beantwoordt de vraag: Uit welk natuurlijk materiaal drinkt men het traditionele drankje kava?"
      },
      {
        question: "Uit hoeveel eilanden bestaat Fiji ongeveer (3 of meer dan 300)?",
        answer: "Meer dan 300 eilanden",
        explanation: "Het antwoord is Meer dan 300 eilanden; aanvullende uitleg: 330 eilanden."
      },
      {
        question: "Klopt het dat het zeewater rond Fiji helderblauw is, met koraalriffen?",
        answer: "Waar",
        explanation: "De bewering is waar: het zeewater rond Fiji helderblauw is, met koraalriffen."
      }
    ]
  },
  WSM: {
    name: "Samoa",
    questions: [
      {
        question: "Hoe zeg je ’dankjewel’ in het Samoaans?",
        answer: "Fa’afetai",
        explanation: "Het antwoord is Fa’afetai; dit beantwoordt de vraag: Hoe zeg je ’dankjewel’ in het Samoaans?"
      },
      {
        question: "Hoe heet de traditionele klap- en slapdans op het eigen lichaam?",
        answer: "Pati Pati",
        explanation: "Het antwoord is Pati Pati; aanvullende uitleg: of Fa’ataupati."
      },
      {
        question: "Wat voor traditioneel gerecht is palusami?",
        answer: "Taro-bladeren gevuld met romige kokoscrème gegaard in de oven",
        explanation: "Het antwoord is Taro-bladeren gevuld met romige kokoscrème gegaard in de oven; dit beantwoordt de vraag: Wat voor traditioneel gerecht is palusami?"
      },
      {
        question: "Hoe heten de traditionele grote lichaams-tatoeages bij mannen?",
        answer: "Pe’a",
        explanation: "Het antwoord is Pe’a; dit beantwoordt de vraag: Hoe heten de traditionele grote lichaams-tatoeages bij mannen?"
      },
      {
        question: "Hoe heet het reusachtige, diepe, groene natuurlijke zwemgat dat met de zee is verbonden?",
        answer: "To Sua Ocean Trench",
        explanation: "Het antwoord is To Sua Ocean Trench; dit beantwoordt de vraag: Hoe heet het reusachtige, diepe, groene natuurlijke zwemgat dat met de zee is verbonden?"
      },
      {
        question: "In welke grote oceaan ligt de eilandstaat Samoa?",
        answer: "De Stille Oceaan",
        explanation: "Het antwoord is De Stille Oceaan; aanvullende uitleg: Grote Oceaan."
      }
    ]
  },
  KIR: {
    name: "Kiribati",
    questions: [
      {
        question: "Klopt het dat men in Kiribati Engels en Kiribatisch spreekt?",
        answer: "Waar",
        explanation: "De bewering is waar: men in Kiribati Engels en Kiribatisch spreekt."
      },
      {
        question: "Klopt het dat dansers vogelachtige hoofdbewegingen maken?",
        answer: "Waar",
        explanation: "De bewering is waar: dansers vogelachtige hoofdbewegingen maken."
      },
      {
        question: "Wat eet men als basisvoedsel dat met kokos wordt bereid?",
        answer: "Taro-wortel en vis",
        explanation: "Het antwoord is Taro-wortel en vis; dit beantwoordt de vraag: Wat eet men als basisvoedsel dat met kokos wordt bereid?"
      },
      {
        question: "Wat is er uniek aan de geografische ligging van Kiribati?",
        answer: "Alle vier de halfronden",
        explanation: "Kiribati ligt rond de evenaar en de internationale datumgrens en strekt zich daardoor uit over alle vier de halfronden."
      },
      {
        question: "Hoe heet het bekende koraalatol dat naar een feestdag is vernoemd?",
        answer: "Kersteiland",
        explanation: "Het antwoord is Kersteiland; aanvullende uitleg: Kiritimati."
      },
      {
        question: "Klopt het dat Kiribati uit heel lage koraaleilandjes bestaat?",
        answer: "Waar",
        explanation: "De bewering is waar: Kiribati uit heel lage koraaleilandjes bestaat."
      }
    ]
  },
  MHL: {
    name: "Marshalleilanden",
    questions: [
      {
        question: "Wat zijn de twee officiële talen op de Marshalleilanden?",
        answer: "Engels en Marshallees",
        explanation: "Het antwoord is Engels en Marshallees; dit beantwoordt de vraag: Wat zijn de twee officiële talen op de Marshalleilanden?"
      },
      {
        question: "Klopt het dat ouderen oude gezangen voor de jeugd zingen?",
        answer: "Waar",
        explanation: "De bewering is waar: ouderen oude gezangen voor de jeugd zingen."
      },
      {
        question: "Klopt het dat men graag verse vis eet die met kokosnoot is gekookt?",
        answer: "Waar",
        explanation: "De bewering is waar: men graag verse vis eet die met kokosnoot is gekookt."
      },
      {
        question: "Hoe heet het grote feest ter ere van de eerste verjaardag van een kind?",
        answer: "Kemem",
        explanation: "Het antwoord is Kemem; dit beantwoordt de vraag: Hoe heet het grote feest ter ere van de eerste verjaardag van een kind?"
      },
      {
        question: "Voor welke grote proeven werd het Bikini-atol vroeger gebruikt?",
        answer: "Kernproeven",
        explanation: "Het antwoord is Kernproeven; aanvullende uitleg: atoombomproeven."
      },
      {
        question: "Waarvan maakten zeevaarders vroeger kaarten om de golven te lezen?",
        answer: "Van houten stokjes en schelpjes",
        explanation: "Het antwoord is Van houten stokjes en schelpjes; aanvullende uitleg: stokkaarten."
      }
    ]
  },
  FSM: {
    name: "Micronesia",
    questions: [
      {
        question: "Wat is de officiële taal in de eilandstaat Micronesia?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal in de eilandstaat Micronesia?"
      },
      {
        question: "Klopt het dat mannen dansen uitvoeren met houten slagstokken?",
        answer: "Waar",
        explanation: "De bewering is waar: mannen dansen uitvoeren met houten slagstokken."
      },
      {
        question: "Wat voor grote wortelgewassen verbouwt men voor traditionele maaltijden?",
        answer: "Yam-wortels",
        explanation: "Het antwoord is Yam-wortels; dit beantwoordt de vraag: Wat voor grote wortelgewassen verbouwt men voor traditionele maaltijden?"
      },
      {
        question: "Hoe heet de geheimzinnige oude stenen ruïnestad gebouwd op het water?",
        answer: "Nan Madol",
        explanation: "Het antwoord is Nan Madol; dit beantwoordt de vraag: Hoe heet de geheimzinnige oude stenen ruïnestad gebouwd op het water?"
      },
      {
        question: "Klopt het dat Micronesia uit honderden kleine eilandjes bestaat?",
        answer: "Waar",
        explanation: "De bewering is waar: Micronesia uit honderden kleine eilandjes bestaat."
      },
      {
        question: "Welke reusachtige roggen zwemmen rond de koraalriffen?",
        answer: "Mantaroggen",
        explanation: "Het antwoord is Mantaroggen; dit beantwoordt de vraag: Welke reusachtige roggen zwemmen rond de koraalriffen?"
      }
    ]
  },
  NRU: {
    name: "Nauru",
    questions: [
      {
        question: "Welke twee talen spreekt men in Nauru?",
        answer: "Engels en Nauruaans",
        explanation: "Het antwoord is Engels en Nauruaans; dit beantwoordt de vraag: Welke twee talen spreekt men in Nauru?"
      },
      {
        question: "Klopt het dat men op zondag traditionele hymnes in de kerk zingt?",
        answer: "Waar",
        explanation: "De bewering is waar: men op zondag traditionele hymnes in de kerk zingt."
      },
      {
        question: "Klopt het dat men vis eet die met verse kokosnoot is bereid?",
        answer: "Waar",
        explanation: "De bewering is waar: men vis eet die met verse kokosnoot is bereid."
      },
      {
        question: "Hoe groot is de eilandrepubliek Nauru ongeveer (21 km² of 5.000 km²)?",
        answer: "Slechts 21 km²",
        explanation: "Het antwoord is Slechts 21 km²; aanvullende uitleg: de kleinste eilandrepubliek ter wereld."
      },
      {
        question: "Welke delfstof bracht het eilandje vroeger tijdelijk grote rijkdom?",
        answer: "Fosfaat",
        explanation: "Het antwoord is Fosfaat; dit beantwoordt de vraag: Welke delfstof bracht het eilandje vroeger tijdelijk grote rijkdom?"
      },
      {
        question: "Klopt het dat Nauru in de Stille Oceaan ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: Nauru in de Stille Oceaan ligt."
      }
    ]
  },
  PLW: {
    name: "Palau",
    questions: [
      {
        question: "Wat is de officiële taal op Palau?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; aanvullende uitleg: en Palauaans."
      },
      {
        question: "Klopt het dat mannen dansen uitvoeren op het dorpsplein?",
        answer: "Waar",
        explanation: "De bewering is waar: mannen dansen uitvoeren op het dorpsplein."
      },
      {
        question: "Klopt het dat men traditionele maaltijden eet die met kokosmelk zijn bereid?",
        answer: "Waar",
        explanation: "De bewering is waar: men traditionele maaltijden eet die met kokosmelk zijn bereid."
      },
      {
        question: "Hoe heten de houten ontmoetingshuizen voor de dorpsoudsten?",
        answer: "Bai",
        explanation: "Het antwoord is Bai; dit beantwoordt de vraag: Hoe heten de houten ontmoetingshuizen voor de dorpsoudsten?"
      },
      {
        question: "Wat is er zo bijzonder aan het beroemde Kwallenmeer (Jellyfish Lake)?",
        answer: "Het zit vol met miljoenen ongevaarlijke kwallen die niet steken",
        explanation: "Het antwoord is Het zit vol met miljoenen ongevaarlijke kwallen die niet steken; dit beantwoordt de vraag: Wat is er zo bijzonder aan het beroemde Kwallenmeer (Jellyfish Lake)?"
      },
      {
        question: "Klopt het dat Palau het eerste land ter wereld was dat zijn zeewater tot haaienreservaat uitriep?",
        answer: "Waar",
        explanation: "De bewering is waar: Palau het eerste land ter wereld was dat zijn zeewater tot haaienreservaat uitriep."
      }
    ]
  },
  PNG: {
    name: "Papoea-Nieuw-Guinea",
    questions: [
      {
        question: "Welke bekende creooltaal spreekt men naast het Engels?",
        answer: "Tok Pisin",
        explanation: "Het antwoord is Tok Pisin; dit beantwoordt de vraag: Welke bekende creooltaal spreekt men naast het Engels?"
      },
      {
        question: "Hoe heet de houten, zandlopervormige trom van de stammen?",
        answer: "De Kundu-trommel",
        explanation: "Het antwoord is De Kundu-trommel; dit beantwoordt de vraag: Hoe heet de houten, zandlopervormige trom van de stammen?"
      },
      {
        question: "Hoe noemt men de ondergrondse stoomoven waarin stammen koken?",
        answer: "Een mumu",
        explanation: "Het antwoord is Een mumu; dit beantwoordt de vraag: Hoe noemt men de ondergrondse stoomoven waarin stammen koken?"
      },
      {
        question: "Hoe heten de grote feestelijke bijeenkomsten waar stammen samenkomen?",
        answer: "Sing-singfeesten",
        explanation: "Het antwoord is Sing-singfeesten; dit beantwoordt de vraag: Hoe heten de grote feestelijke bijeenkomsten waar stammen samenkomen?"
      },
      {
        question: "Hoeveel verschillende talen worden er ongeveer in het land gesproken?",
        answer: "Meer dan 800 verschillende talen",
        explanation: "Het antwoord is Meer dan 800 verschillende talen; dit beantwoordt de vraag: Hoeveel verschillende talen worden er ongeveer in het land gesproken?"
      },
      {
        question: "Welke felgekleurde vogel is het nationale symbool?",
        answer: "De paradijsvogel",
        explanation: "Het antwoord is De paradijsvogel; dit beantwoordt de vraag: Welke felgekleurde vogel is het nationale symbool?"
      }
    ]
  },
  SLB: {
    name: "Salomonseilanden",
    questions: [
      {
        question: "Wat is de officiële taal van de Salomonseilanden?",
        answer: "Engels",
        explanation: "Het antwoord is Engels; dit beantwoordt de vraag: Wat is de officiële taal van de Salomonseilanden?"
      },
      {
        question: "Van welk natuurlijk materiaal maken muzikanten panfluitmuziek?",
        answer: "Bamboe",
        explanation: "Het antwoord is Bamboe; aanvullende uitleg: bamboepanfluiten."
      },
      {
        question: "Wat voor deeggerecht eet men dat in bananenblad is gegaard?",
        answer: "Cassavedeeg",
        explanation: "Het antwoord is Cassavedeeg; dit beantwoordt de vraag: Wat voor deeggerecht eet men dat in bananenblad is gegaard?"
      },
      {
        question: "Met welk glimmend materiaal versieren houtsnijders hun kunstwerken?",
        answer: "Parelmoer",
        explanation: "Het antwoord is Parelmoer; aanvullende uitleg: schelpen-inleg."
      },
      {
        question: "Hoe heet de grootste zoutwaterlagune ter wereld, die bij de eilanden ligt?",
        answer: "De Marovo-lagune",
        explanation: "Het antwoord is De Marovo-lagune; dit beantwoordt de vraag: Hoe heet de grootste zoutwaterlagune ter wereld, die bij de eilanden ligt?"
      },
      {
        question: "Klopt het dat de eilandengroep in de Stille Oceaan ligt?",
        answer: "Waar",
        explanation: "De bewering is waar: de eilandengroep in de Stille Oceaan ligt."
      }
    ]
  },
  TON: {
    name: "Tonga",
    questions: [
      {
        question: "Wat voor staatsvorm heeft Tonga?",
        answer: "Een koninkrijk",
        explanation: "Het antwoord is Een koninkrijk; aanvullende uitleg: monarchie."
      },
      {
        question: "Hoe heet de traditionele zang- en dansstijl die op de UNESCO-lijst staat?",
        answer: "Lakalaka",
        explanation: "Het antwoord is Lakalaka; dit beantwoordt de vraag: Hoe heet de traditionele zang- en dansstijl die op de UNESCO-lijst staat?"
      },
      {
        question: "Wat voor nationaal gerecht is lu pulu?",
        answer: "Vlees en kokoscrème ingepakt en gegaard in taro-bladeren",
        explanation: "Het antwoord is Vlees en kokoscrème ingepakt en gegaard in taro-bladeren; dit beantwoordt de vraag: Wat voor nationaal gerecht is lu pulu?"
      },
      {
        question: "Wat dragen inwoners om hun middel gewikkeld bij feestelijke gelegenheden?",
        answer: "Traditioneel geweven matten",
        explanation: "Het antwoord is Traditioneel geweven matten; aanvullende uitleg: Ta’ovala."
      },
      {
        question: "Klopt het dat Tonga het enige land in de Stille Oceaan is dat nooit door Europeanen is gekoloniseerd?",
        answer: "Waar",
        explanation: "De bewering is waar: Tonga het enige land in de Stille Oceaan is dat nooit door Europeanen is gekoloniseerd."
      },
      {
        question: "Welke reusachtige walvissen komen elk jaar paren in de warme wateren van Tonga?",
        answer: "Bultrugwalvissen",
        explanation: "Het antwoord is Bultrugwalvissen; dit beantwoordt de vraag: Welke reusachtige walvissen komen elk jaar paren in de warme wateren van Tonga?"
      }
    ]
  },
  TUV: {
    name: "Tuvalu",
    questions: [
      {
        question: "Welke twee talen spreekt men in Tuvalu?",
        answer: "Engels en Tuvaluaans",
        explanation: "Het antwoord is Engels en Tuvaluaans; dit beantwoordt de vraag: Welke twee talen spreekt men in Tuvalu?"
      },
      {
        question: "Op wat voor voorwerpen drumt men tijdens de traditionele fatele-dans?",
        answer: "Op grote houten kisten of dozen",
        explanation: "Het antwoord is Op grote houten kisten of dozen; dit beantwoordt de vraag: Op wat voor voorwerpen drumt men tijdens de traditionele fatele-dans?"
      },
      {
        question: "Welk traditioneel gewas bereidt men met verse kokoscrème?",
        answer: "Moerastaro",
        explanation: "Het antwoord is Moerastaro; aanvullende uitleg: Pulaka."
      },
      {
        question: "Aan welke bekende internetextensie verdient het land jaarlijks geld?",
        answer: "De extensie ’.tv’",
        explanation: "Het antwoord is De extensie ’.tv’; dit beantwoordt de vraag: Aan welke bekende internetextensie verdient het land jaarlijks geld?"
      },
      {
        question: "Waarom wordt Tuvalu ernstig bedreigd door klimaatverandering?",
        answer: "Omdat de koraaleilanden heel laag liggen en de zeespiegel stijgt",
        explanation: "Het antwoord is Omdat de koraaleilanden heel laag liggen en de zeespiegel stijgt; dit beantwoordt de vraag: Waarom wordt Tuvalu ernstig bedreigd door klimaatverandering?"
      },
      {
        question: "Klopt het dat Tuvalu uit smalle, lage koraaleilandjes bestaat?",
        answer: "Waar",
        explanation: "De bewering is waar: Tuvalu uit smalle, lage koraaleilandjes bestaat."
      }
    ]
  },
  VUT: {
    name: "Vanuatu",
    questions: [
      {
        question: "Welke drie talen zijn officieel in Vanuatu?",
        answer: "Bislama, Engels en Frans",
        explanation: "Het antwoord is Bislama, Engels en Frans; dit beantwoordt de vraag: Welke drie talen zijn officieel in Vanuatu?"
      },
      {
        question: "Waarmee maken vrouwen unieke, ritmische klanken bij de ’Water Music’?",
        answer: "Door met hun handen op het zeewater te slaan",
        explanation: "Het antwoord is Door met hun handen op het zeewater te slaan; dit beantwoordt de vraag: Waarmee maken vrouwen unieke, ritmische klanken bij de ’Water Music’?"
      },
      {
        question: "Wat voor nationaal gerecht is laplap?",
        answer: "Geraspte yuca/bananenpuree gegaard met kokoscrème op hete stenen",
        explanation: "Het antwoord is Geraspte yuca/bananenpuree gegaard met kokoscrème op hete stenen; dit beantwoordt de vraag: Wat voor nationaal gerecht is laplap?"
      },
      {
        question: "Welke extreme sport is ontstaan uit de traditionele lianensprongen van torens?",
        answer: "Bungeejumpen",
        explanation: "Het antwoord is Bungeejumpen; aanvullende uitleg: Land Diving / Naghol."
      },
      {
        question: "Welke zeer actieve vulkaan op het eiland Tanna kun je van dichtbij bekijken?",
        answer: "Mount Yasur",
        explanation: "Het antwoord is Mount Yasur; dit beantwoordt de vraag: Welke zeer actieve vulkaan op het eiland Tanna kun je van dichtbij bekijken?"
      },
      {
        question: "Klopt het dat Vanuatu een tropische eilandengroep is?",
        answer: "Waar",
        explanation: "De bewering is waar: Vanuatu een tropische eilandengroep is."
      }
    ]
  },
};
