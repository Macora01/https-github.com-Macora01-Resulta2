export interface FinancialRecord {
  year: number;
  month: string;
  monthIndex: number; // 0-11
  ventasNetas: number;
  costo: number;
  gastos: number;
  resultadoMes: number;
}

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const financialData: FinancialRecord[] = [
  // 2022
  { year: 2022, month: 'Septiembre', monthIndex: 8, ventasNetas: 29597991, costo: 13319096, gastos: 14208955, resultadoMes: 2069940 },
  { year: 2022, month: 'Octubre', monthIndex: 9, ventasNetas: 39470970, costo: 17761936, gastos: 13191022, resultadoMes: 8518011 },
  { year: 2022, month: 'Noviembre', monthIndex: 10, ventasNetas: 58964607, costo: 26534073, gastos: 22559821, resultadoMes: 9870713 },
  { year: 2022, month: 'Diciembre', monthIndex: 11, ventasNetas: 125204431, costo: 56341994, gastos: 55752692, resultadoMes: 13109745 },

  // 2023
  { year: 2023, month: 'Enero', monthIndex: 0, ventasNetas: 45416050, costo: 20437223, gastos: 8988843, resultadoMes: 15989985 },
  { year: 2023, month: 'Febrero', monthIndex: 1, ventasNetas: 35801353, costo: 16110609, gastos: 8680730, resultadoMes: 11010014 },
  { year: 2023, month: 'Marzo', monthIndex: 2, ventasNetas: 29202751, costo: 14601376, gastos: 10360178, resultadoMes: 4241198 },
  { year: 2023, month: 'Abril', monthIndex: 3, ventasNetas: 38028001, costo: 19014001, gastos: 14119591, resultadoMes: 4894409 },
  { year: 2023, month: 'Mayo', monthIndex: 4, ventasNetas: 48873851, costo: 24436925, gastos: 15614310, resultadoMes: 8822616 },
  { year: 2023, month: 'Junio', monthIndex: 5, ventasNetas: 29710743, costo: 14855371, gastos: 13331131, resultadoMes: 1524240 },
  { year: 2023, month: 'Julio', monthIndex: 6, ventasNetas: 30740504, costo: 15370252, gastos: 12705607, resultadoMes: 2664645 },
  { year: 2023, month: 'Agosto', monthIndex: 7, ventasNetas: 57375331, costo: 28687666, gastos: 13451751, resultadoMes: 15235914 },
  { year: 2023, month: 'Septiembre', monthIndex: 8, ventasNetas: 33497042, costo: 16748521, gastos: 11742957, resultadoMes: 5005564 },
  { year: 2023, month: 'Octubre', monthIndex: 9, ventasNetas: 39045630, costo: 17570534, gastos: 16423200, resultadoMes: 5051896 },
  { year: 2023, month: 'Noviembre', monthIndex: 10, ventasNetas: 63541765, costo: 28593794, gastos: 20734001, resultadoMes: 14213970 },
  { year: 2023, month: 'Diciembre', monthIndex: 11, ventasNetas: 85540767, costo: 38493345, gastos: 20479161, resultadoMes: 26568261 },

  // 2024
  { year: 2024, month: 'Enero', monthIndex: 0, ventasNetas: 48993676, costo: 24496838, gastos: 10770575, resultadoMes: 13726263 },
  { year: 2024, month: 'Febrero', monthIndex: 1, ventasNetas: 47402108, costo: 23701054, gastos: 9971395, resultadoMes: 13729659 },
  { year: 2024, month: 'Marzo', monthIndex: 2, ventasNetas: 33640854, costo: 20184512, gastos: 11760407, resultadoMes: 1695934 },
  { year: 2024, month: 'Abril', monthIndex: 3, ventasNetas: 27237787, costo: 16342672, gastos: 9677269, resultadoMes: 1217846 },
  { year: 2024, month: 'Mayo', monthIndex: 4, ventasNetas: 25984537, costo: 12992269, gastos: 10207974, resultadoMes: 2784295 },
  { year: 2024, month: 'Junio', monthIndex: 5, ventasNetas: 18999118, costo: 9499559, gastos: 9850423, resultadoMes: -350864 },
  { year: 2024, month: 'Julio', monthIndex: 6, ventasNetas: 20288235, costo: 10144118, gastos: 9694039, resultadoMes: 450079 },
  { year: 2024, month: 'Agosto', monthIndex: 7, ventasNetas: 18208676, costo: 9104338, gastos: 7029248, resultadoMes: 2075090 },
  { year: 2024, month: 'Septiembre', monthIndex: 8, ventasNetas: 15684927, costo: 8626710, gastos: 6379404, resultadoMes: 678813 },
  { year: 2024, month: 'Octubre', monthIndex: 9, ventasNetas: 40858811, costo: 20429405, gastos: 12858393, resultadoMes: 7571012 },
  { year: 2024, month: 'Noviembre', monthIndex: 10, ventasNetas: 74411483, costo: 40926316, gastos: 15545162, resultadoMes: 17940005 },
  { year: 2024, month: 'Diciembre', monthIndex: 11, ventasNetas: 118598691, costo: 65229280, gastos: 23645661, resultadoMes: 29723750 },

  // 2025
  { year: 2025, month: 'Enero', monthIndex: 0, ventasNetas: 52097735, costo: 25701122, gastos: 14217611, resultadoMes: 12179002 },
  { year: 2025, month: 'Febrero', monthIndex: 1, ventasNetas: 31494748, costo: 16436203, gastos: 8952717, resultadoMes: 6105828 },
  { year: 2025, month: 'Marzo', monthIndex: 2, ventasNetas: 57640933, costo: 43281510, gastos: 9400312, resultadoMes: 4959111 },
  { year: 2025, month: 'Abril', monthIndex: 3, ventasNetas: 27539622, costo: 13333592, gastos: 8930399, resultadoMes: 5275630 },
  { year: 2025, month: 'Mayo', monthIndex: 4, ventasNetas: 35458716, costo: 16615321, gastos: 13288190, resultadoMes: 5555204 },
  { year: 2025, month: 'Junio', monthIndex: 5, ventasNetas: 8515454, costo: 3914736, gastos: 4816147, resultadoMes: -215429 },
  { year: 2025, month: 'Julio', monthIndex: 6, ventasNetas: 15802521, costo: 8337297, gastos: 7806082, resultadoMes: -340858 },
  { year: 2025, month: 'Agosto', monthIndex: 7, ventasNetas: 22743866, costo: 13005179, gastos: 9704230, resultadoMes: 34457 },
  { year: 2025, month: 'Septiembre', monthIndex: 8, ventasNetas: 14399622, costo: 5972302, gastos: 7112565, resultadoMes: 1314754 },
  { year: 2025, month: 'Octubre', monthIndex: 9, ventasNetas: 24364034, costo: 11076965, gastos: 8740461, resultadoMes: 4546608 },
  { year: 2025, month: 'Noviembre', monthIndex: 10, ventasNetas: 84647941, costo: 38784995, gastos: 16448018, resultadoMes: 29414928 },
  { year: 2025, month: 'Diciembre', monthIndex: 11, ventasNetas: 106385787, costo: 51464173, gastos: 22322086, resultadoMes: 32599529 },

  // 2026
  { year: 2026, month: 'Enero', monthIndex: 0, ventasNetas: 63350775, costo: 29087373, gastos: 16632413, resultadoMes: 17630988 },
  { year: 2026, month: 'Febrero', monthIndex: 1, ventasNetas: 48128916, costo: 25314464, gastos: 12747664, resultadoMes: 10066787 },
  { year: 2026, month: 'Marzo', monthIndex: 2, ventasNetas: 33693204, costo: 21702003, gastos: 12505430, resultadoMes: -514229 },
];
