/**
 * ASCII Knight with Flowing Red Cloak
 * Derived from @arimecoa/GIVEAWAY-ASCII (knight.html)
 * High-performance 32-bit pixel-buffer ASCII rendering with multi-scale Gaussian bloom.
 * 
 * Features full responsive mobile & desktop adaptation with zero letterboxing.
 */

export class AsciiKnight {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isRunning = false;
    this.animId = null;
    this.t0 = performance.now();
    this.lastDraw = -1e9;
    this.resizeDebounce = null;

    this.init();
  }

  init() {
    this.LOOP = 2.4;
    this.WAVE = 3.2;
    this.GLOW = 0.5;
    this.BREATH = 0.9;
    this.SWAY = 0.7;
    this.CLOAK = 3.2;
    this.GRASS_WIND = 2.0;
    this.GRASS_HEIGHT = 1.7;
    this.FONT_SIZE = 12;
    this.FPS = 30;
    this.BG = [0x00, 0x00, 0x00];
    this.KNIGHT_RGB = [0.64, 0.66, 0.70];
    this.RED = [0.80, 0.09, 0.11];
    this.RED_DARK = [0.34, 0.02, 0.04];
    this.GRASS_FAR = [0.20, 0.27, 0.26];
    this.GRASS_NEAR = [0.32, 0.50, 0.28];
    this.GRASS_TIP = [0.82, 0.72, 0.40];

    this.BUCKETS = [" ", ".", ":-", "=+", "*%", "#", "@"];
    this.LEVELS = [0.06, 0.18, 0.32, 0.48, 0.64, 0.80];

    this.KNIGHT = {
      cols: 152,
      rows: 119,
      data: ["00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "00000000000000000000000000000000000000000000000000000000000000004777767782000000000000000000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000377d700000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "00000000000000000000000000000000000000000000000000000000000377d30000030000003000000000000000000000000000000000000000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000000000000178b3500003000000034341000000000000000000000000000000000000000000000000000000000000000000000000", "00000000000000000000000000000000000000000000000000000000177400000000000000033336720000000000000000000000000000000000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000000000067c3000000000345000030422100000000000000000000000000000000000000000000000000000000000000000000000", "00000000000000000000000000000000000000000000000000000277800000000000300030334331220000000000000000000000000000000000000000000000000000000000000000000000", "00000000000000000000000000000000000000000000000000000678000000000000003035035976430353000000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000001458000000000000003534696458b950000000000000000000000000000000000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000000377500000003330050678cc9b9321002300000000000000000000000000000000000000000000000000000000000000000000", "000000000000000000000000003000000000000000000000003783000000000055474797b89a7878753530000000000000000000000000000000000000000000000000000000000000000000", "0000000000000000002631560479000000000000000000000257975350030557757dddaa8aabbbd9555548950000000000000000000000000000000000000000000000000000000000000000", "000000000000000025568552669744000000000000000000277acc9ac567775774999da7ca867ad9464256775767000000000000000000000000000000000000000000000000000000000000", "00000000000000000059898499ae000000000000000000006bbbcc8743067959bdad91cf8898899bd955567786777773000000000056addcbbbcc75000000000000000000000000000000000", "00000000000000000005feabfea00000000000000000000005bcb74644477799ddd1deea88bbbb779ca57778779997777973009bbdddddccdccdc9addb600000000000000000000000000000", "000000000000000000003aa9a50000000000000000000000005ba878ad9999dd90bec57cddeecdddb99a976bdd979797730dbdbbbbdb797776786899999dd000000000000000000000000000", "000000000000000000000597c000000000000000000000000005ddbbcad99970fec169cdc9bedbcdb9bc99ba9ad999745fdddda786ca610000000256899ddbf0000000000000000000000000", "000000000000000000000255c0000000000000000000000000027ddd9add07ff949dda77ceddcbcddbaccccadc7d990fcdb9763564000000000000000037ddcf400000000000000000000000", "0000000000000000000008c6c00000000000000000000000000028bb81afeb59dd77dee88bcdddccdcbbaabcadd97bddc70640300000000000130000033509dcf00000000000000000000000", "000000000000000000003867c00000000000000000000000000002bfefd45d999efa7bdeddcddbbbbdecbcddc795bdcc5300441034000341000002756736700dcd1000000000000000000000", "000000000000000000004a47c40000000000000000000000000004a82bedafff33eecbaadfebbcbdeeca9aa8c78edd5000300053100004200000039ac77775554b1000000000000000000000", "000000000000000000004a87dc00000000000000000000000000005fddcfe75cf84ddddacdecbbdedbbba98757bbb7000756655300004589acb9bcbddc617455390000000000000000000000", "000000000000000000038c78ca0000000000000000000000000000004fd7aff3bdbd9bdfdbdebdfdcffedc7966bd3000305344009a3000320038567771667fc3940000000000000000000000", "00000000000000000005dc66fc000000000000000000000000000000001dbfcfb9def948abbdfffeeedb47788dc4000000004762000000440145755350000009c40000000000000000000000", "000000000000000006936777aa00000000000000000000000000000000006fcdfef6ddbbbdefddfca94738bb48003000000974100000006beebbcbbcea400007097100000000000000000000", "0000000000000000440063016a0000000000000000000000000000000001bd7ffadbecbdffeffdcb746965786700400000971000079300023004a35443005d70004710000000000000000000", "00000000000000980018cfd9655b90000000000000000000000000000006bd009becbdefffefb7a72ad97ac74300000070000082000000000018c79965300007c30000000000000000000000", "000000000000044000140004fece9755000000000000000000000000003eb400004beeeddeb6465126689abb30003000550085100000037abbbcdbbddc74000007d100000000000000000000", "0000000000004999bdfefec7176ddbccb10000000000000000013300003eb3000000cbda78467645765accfc00000054507d74103ba00000005a069877454dc5005b20000000000000000000", "0000000000000000023368eeffedd9dff1000000000000021123500002ced700000304557866634566aeecd84499005507d565410000000000024305006600007b1410000000000000000000", "000000000000046553bb9964317cefffd1000000000000002324300052cfe40000000367737676779ffedddd903450f49d94d200000008edca8678abbced000003b600000000000000000000", "000000000000065248eefffefddd8fff90000000000000000244000016bcef500040046435877aeeeea69b8a97540975997760003400000000002731400007c503d100000000000000000000", "00000000000000442386777648efeffcb10000000000331023000002abcfef54530376657ceffffe95279b8dcd595b9579d9464000000000001545764717000dc70000000000000000000000", "0000000000000005adfefffefffebbc979100000008a730047407bdbdbbcef979056bdefffeffb6223388aabddb77709d977910000030331026565300035d5007d1000000000000000000000", "0000000000000000026bedbbcddbbbdcfee91000005520049bbbadcbdeffe7dc300007cfffe9000045565abba9abb057777491094000002333548addc400007c570000000000000000000000", "000000000000335469bb98a7d7bd97754005860000000079667ccea9dcfe7dcf00000003723000000399cca8744dbbf7307ec8500000000023002300006d3009f00000000000000000000000", "0000050005878acddcb9c9568bc5efccd77d10050000047975899acaabffeffc3000000000050000027997306602ebcfffea7600000000002355796000000975c00000000000000000000000", "000007677bb3000006a789848c59b479bbbea99544203aeb99bdcbc9bfffeffc0000000066000000028bcb3044451bccffd975105acabddcccbcfffd83000077000000000000000000000000", "0000569a400000000016553566030303beefcdb5899775ab99bddffecfffeff930000000ab975200028bac99977777ddd9d100035566358aabdcccdcefed0599000000000000000000000000", "00004a30000000000003788778000003feeffeeea9abca776adbbbbdeffebffd00503651a7259bb6139db8799767d797c3000003003003146568789addcfed37000000000000000000000000", "00000000000000000003544444400009feeffcbbdddddcedaacebbbccfffeffc404034107c957344338b98bda74197d9030000050000000000147878779eefc0000b50000000000000000000", "00000000000000000000384686000004feeffcbbdddcbcbccdfeffecbbcfefff753353003b74464467799abc767594753799176c820000000000244789afe930000da1000000000000000000", "00000000000000000000258680005079bbbceecbbbbbbcddbbbbcebdefffefcd975353535ac77555798667abc56377cfffe8d75710000000014600445bdd50500009b5000000000000000000", "00000000000000000000048670003755dbbcecbbbbbbbcbbbbbbbcedeece0000597465b84bcddb999999873000005bdddd5660530000000000000000157400300000de200000000000000000", "0000000000000000000000674004977579bebbdbbbbdfffedbbbbceccddd00000597779788bebbca8600000000001b00333000000000000002430000000055300000ad600000000000000000", "0000000000000000000001770001955457dddbbbbbbdfecddbbcfecea70000000079968a979c72000000000000001d000400000000330000001535300000049370000ce30000000000000000", "00000000000000000000005460000000079ddbbbbbbdecbbcebcffeb60000000000007cd400000000000000000000750000000000000003410039ab63300079700000cc82000000000000000", "000000000000000000004c87dc0000004759ddbbbbdeccccccbbbbcec400000000000c80000000000000000000005d3000000003600000235633988a97677d900000009d4000000000000000", "0000000000000000000002568000000077d5ddddbbabcccbcebbbbbbdc40000000000c40000000000001300000004d5040004658523465147acea8adbd9979750d5976ce8200000000000000", "00000000000000000000025460000000304799cbb69cbcccbbcc90000000000000053087200000021015600000017b57990003b50056677acddcebbdbbbdddd7fbdbda7cdacd500000000000", "00000000000000000000026400000000043047923abbbcbccbcb700000000000000004a844465000028cbccfefebbbccffb465557aaabccbbbbbcfedbbdbbbccffbbbda7adddb30000000000", "0000000000000000000001430000000000003addbdddddccdca700000000007534535cdddfefdbbbbbbcca631440507dffee99789cedbbbbcffefffea763549cffec79cbca99774000000000", "000000000000000000000030300000000000038cdddddb76300000000000000745003cefffefffdbbb80000000000005447efeebbbcbbbdeeeceebba96433357cfbecbddfd83000000000000", "00000000000000000000025030000000000000000000000000000000000000377ecbeeefffeffffd700000000000030057758deffffddfddeffea478bdd997559dbddcacffea200000000000", "0000000000000000000000530000000000000000000000000000000000003007dbeefee815afb63000000000000000000054748adffeffdb9659fdc8867749cd9777d8509bda200000000000", "0000000000000000000000330000000000000000000000000000000000000459fefefee5000073000000000000000000033546777888865663133aa79778bf9779797767cfda730000000000", "00000000000000000000000000000000000000000000000000000000000537dfbefefc3000586300000000000000000000000056465777412300027d9abbbfc7447997ca7bdcd60000000000", "00000000000000000000000000000000000000000000000000000000000379f77efcb500053000000000000000005000000000000367344421200006bcebd9dfd7404797c6abb93000000000", "00000000000000000000000000000000000000000000000000000000006cef903beef3000992000000000050000177000000000034675754200000007cebbd77cfa779976ccbcd7000000000", "00000000000000000000000000000000000000000000000000000000045dbf700efef3000005300000000000000003304000000346842487300000002aceddd97dbefea954accb5000000000", "00000000000000000000000300000000000000000000000000000000015bbfc00dbbe30005a80005bffecfffeffed7000000000578250576203523302bfebd977799ded8658acdb500000000", "00000000000000000000000500000000000000000000000000000000006eeff703771009ba33bfda87876cebbbcfefffffeee500360035753568300028feb97774d79ddac89ceddd80000000", "0000000000000000000000050000000000000000000000000000000002dceffffec7103573bffc4000003abdddbcebddcbbbeeeffd7404ab9baab30049ebd79799bdbbdbd97bdca468000000", "000000000000000000000014000000000000000000000000000000000015bbcffefe792057add930000158bbcabcebdddbbdddbbbddbb767668378368eed777549dbadddd87bddc702600000", "0000000000000000000000140000000000000000000000000000000000019dfffef200053008a730001308c9addbdd9ddd7d97cddb87acdc74736768aced99799dddbdbd9657beda52520000", "0000000000000000000000140000000000000000000000000000000000000004bef6108cd8adf800000003999adbddddd7bd7dea88549bbdeb6648addbbbb977cd99ddbda568999ca4000000", "000000000000000000000014000000000000000000000000000000000000000000000cd7038dfb30000004dbddddbbdcdd7beeeda567abbdefd97b7abcebd77dc977ddbda78678bd80000000", "000000000000000000000044000000000000000000000000000000000000000030003ca205cfda72000137abbbddbbcd77bbbbdac965adcdefdbc98dbceb977dc7799ddb9787bdda52300000", "000000000000000000000014000000000000000000000000000000000000000000006797bdefb7aa5000028bbdbbbf7dcdd977cacbbbbbbbcfeccfebcebb979cc7777999cacbbdb610000000", "0000000000000000000003050000000000000000000000000000000000000000000000009dddb9ba4000259feceb5dcccbdd54303addbbbbcebbcbcfeebdd79cf9777797adbbddb500000000", "000000000000000000000344000000000000000000000000000000000000000500000005cfdd96a93000066bdc8ced9c9d74400035abbbdedbbbccffebbdd79cfb9777767830067740000000", "0000000000000000000000440000000000000000000000000000000000000000500d715bfdca7aa5100003bfefedbd7777755350669bbdfdbbbbccffebbbd79ccfd975103000000780000000", "00000000000000000000004400000000000000000000000000000005500000003000039dfea899456000003ddbace9777bbd99999cbbcbbbbbbbcfffebbbd9dd900067100000000320000000", "000000000000000000000364000000000000000000000000000000000000500350000cedbdb7bb720000003dbcebb977dbbdda7cbbccbabbbbbbcfffebbbdd97000000620000000000000000", "00000000000000000000036400000000000000000000000000000000000000007400deeda99776622300004bbbce9d9779eef96053adfffeeebbcffebbbbddd9000000000000000000000000", "0000000000000000000003443300000000000000000000000005c93000000000007efec8678855552240003dddabddd979dd7710009dfddeeffeffc03bbbddd5000000000000000000000000", "000000000000000000000535550000000000000000000000000000000300000007eefcac677884364240003dbdbbbbd77dbbec5003aefdbbcffeb00005bbdbc5000000000000000000000000", "00000000000000000001436445000000000000000000000000000000000040009bcbddaca9b976555000002abdacedd99ddbb74667ceffeed940000002bbbbdd000000000000000000000000", "000000000000000000000565640000000000000000000000000000000000345dbbeba9779c76754550000019a99dbd99999977977bab72000000000002bbbd59000000000000000000000000", "000000000000000000000556440000000000000000000000000000000003097554dd9dacdb86434450000028cdddd9799979ddda720000000000000003ece907000000000000000000000000", "0000000000000000000024444400000000000000000000000000000000000755379bd7c8b976444674013016cfeddd999997d8771000000000000000002bb957000000000000000000000000", "000000000000000000002764440000000000000000000000000000000030535379797adede97554563013016ddbdd9779999997c40000000000000000002e7c7000000000000000000000000", "00000000000000000000176664000000000000000000000000000000000055559d77deddba77566455000007bd97dbdccddd9dd863000000000000300001700f000000000000000000000000", "0000000000000000000017644400000000000000000000000000000003145777d54efeeffb67586487200006a777dbffcbddddda93000455456563550000000d000000000000000000000000", "00000000000000000000175464000000000000000000000000000000355477795dbbbdefda86794479700003dd999bcfddbbddd6444446766673550440000000000000000000000000000000", "0000000000000000000026645600000000000000000000000000005797677770bbcbbdcdfa78673257400003ddd9d9fddbdd9753446578789987300333000000000000000000000000000000", "000000000000000000002751440000000000000053000000000023668977db0dbbcbbdefda79862379900163bdddddc9ddddd87655599ba89bddb87675000000000000000000000000000000", "000000000000000000002754440000000000000bdb5200000000631868dcebcffbcbbdefd969543344200037bd9dddddcbdd9767bcddbbcdddccdcadc0000000000000000000000000000000", "000000000000000000002754760000000000000039800000001302687dddb9ccbbcbbdefe879754668a40003ddd9dd9dcbd979abbbcbbcdccddddcd900000000000000000000000000000000", "00000000000000000000275676000000000000000359ba9d95154458db76efccbecbeeefa9867776578600019bbbd99ddd997cbbbddbbbccbcccdb9000000000000000000000000000000000", "00000000000000000000277764000000000000000005678bccddc8664779bbcffbecbdeeacb84676578800019bbbdddccdd99bddbbcbbbbbccccc90000000000000000000000000000000000", "000000000000000000002777760000000000000000035978aa87bbaadcebdbccfecbeeeda99845875ada30016bbddddddbb97103cdcbbbbbbcdca50000000000000000000000000000000000", "0000000000000000000026777400000000000000003679776689adddbbdbbbccbecefeefccb955787ac800016bddddcfddd971003acbbbbbbbcb950000000000000000000000000000000000", "000000000000000000001777740000000000000000345976ab9bddbbdddbbddcbbce300bdcbdb9adcab800016dbdbbcc9ddd710007bbdecbbcb9970000000000000000000000000000000000", "0000000000000000000026777500000000000000003658789bdccdbbddbdddfcb9100006abbdededbbb800005bbbbbcdcbb9100000acbbbbbcdb983000000000000000000000000000000000", "0000000000000000000026777500000000000003668679789bccdddcbbbbdbc400000000ac8300000000000014359ddccbbd100000008ddbbbabdc7000000000000000000000000000000000", "000000000000000000002677750000000771000033787acabdaaddbcbbbdd00000000000000000000000026bc5030034577740000000004acdfecc7500000000000000000000000000000000", "000000000000000000002477730000000006dbbdffedbccdbbdb8ddbaba000000000000000000000005db668dbce700007714100000000000288763000000000000000000000000000000000", "0000000000000000000024777000000000047cddfdbbbcbbbbcdb599700000000000000000000000274000006579dbfc34430500000000000000000000000000000000000000000000000000", "00000000000000000000247770000000000049cdbbbbbcddccddc7500000000000000000000000032000000330347779cb156b30000000000000000000000000000000000000000000000000", "00000000000000000000079970000000000057cdbbbbccbbbcda50000000000000000000000000058400008dba4335547079dd20000000000000000000000000000000000000000000000000", "0000000000000000000005877000000000000055889accbb9500000000000000000000000000009a200000006579b757059ddb30000000000000000000000000000000000000000000000000", "000000000000000000000177700000000000000000000000000000000000000000000000000006400000003000344790047dd710000000000000000000000000000000000000000000000000", "000000000000000000000178600000000000000000000000000000000000000000000000000004740003aa30533005304377d200000000000000000000000000000000000000000000000000", "0000000000000000000002785000000000000000000000000000000000000000000000000000320000000569a643500379396000000000000000000000000000000000000000000000000000", "000000000000000000000158000000000000000000000000000000000000000000000000003500000000000048da040477730000000000000000000000000000000000000000000000000000", "000000000000000000000005000000000000000000000000000000000000000000000000050000006c83003300674409d7000000000000000000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000000000000000000000000000000000000027ca605304770750000000000000000000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000000000000000000000000000000000000000028da451745000000000000000000000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000000000000000000000000000000045ab600130016da1d00000000000000000000000000000000000000000000000000000000000", "00000000000000000000000000000000000000000000000000000000000000000000000000034454679503004676000000000000000000000000000000000000000000000000000000000000", "00000000000000000000000000000000000000000000000000000000000000000000000003353365566555677c00000000000000000000000000000000000000000000000000000000000000", "00000000000000000000000000000000000000000000000000000000000000000000000053446755676778550000000000000000000000000000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000000000000000000000008948addddda899ba00000000000000000000000000000000000000000000000000000000000000000000", "00000000000000000000000000000000000000000000000000000000000000000000000355460000000000000000000000000000000000000000000000000000000000000000000000000000", "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"]
    };

    this.FONT = `${this.FONT_SIZE}px Menlo, Consolas, "DejaVu Sans Mono", "Courier New", monospace`;
    const probe = document.createElement("canvas").getContext("2d");
    probe.font = this.FONT;
    this.CW = Math.max(1, Math.round(probe.measureText("M").width));
    this.CH = this.FONT_SIZE;

    // Precompute character bitmasks
    this.START = [];
    this.COUNT = this.BUCKETS.map((b) => b.length);
    this.BUCKETS.reduce((s, b, k) => { this.START[k] = s; return s + b.length; }, 0);
    this.GRASS_CHARS = "|/\\',." + "+xX%&";
    this.GRASS0 = this.BUCKETS.join("").length;

    this.MASKS = [...this.BUCKETS.join("") + this.GRASS_CHARS].map((ch) => {
      const g = document.createElement("canvas");
      g.width = this.CW;
      g.height = this.CH;
      const gx = g.getContext("2d");
      gx.font = this.FONT;
      gx.textBaseline = "middle";
      gx.fillStyle = "#fff";
      gx.fillText(ch, 0, this.CH / 2);
      const d = gx.getImageData(0, 0, this.CW, this.CH).data;
      const m = new Uint8Array(this.CW * this.CH);
      for (let k = 0; k < m.length; k++) m[k] = d[k * 4 + 3];
      return m;
    });

    // Knight bitmap intensity
    this.KC = this.KNIGHT.cols;
    this.KR = this.KNIGHT.rows;
    this.knightLum = new Float32Array(this.KC * this.KR);
    this.KNIGHT.data.forEach((row, r) => {
      for (let c = 0; c < this.KC; c++) {
        this.knightLum[r * this.KC + c] = parseInt(row[c], 16) / 15;
      }
    });

    this.knightMask = new Uint8Array(this.KC * this.KR);
    for (let r = 0; r < this.KR; r++) {
      for (let c = 0; c < this.KC; c++) {
        let on = 0;
        for (let dr = -1; dr <= 1 && !on; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const rr = r + dr, cc = c + dc;
            if (rr >= 0 && rr < this.KR && cc >= 0 && cc < this.KC && this.knightLum[rr * this.KC + cc] > 0.08) {
              on = 1;
              break;
            }
          }
        }
        this.knightMask[r * this.KC + c] = on;
      }
    }

    // Base template for red cloak strands & wrap
    this.BASE_STRANDS = [
      { root: [42, 24], ctrl: [55, 17], tip: [75, 8.5], width: 4.6, amp: 0.9, ph: 0.0 },
      { root: [40, 26], ctrl: [56, 24], tip: [77, 30], width: 5.6, amp: 1.0, ph: 1.9 },
      { root: [47, 20], ctrl: [60, 12], tip: [78, 4], width: 1.1, amp: 1.3, ph: 0.9 },
      { root: [52, 29], ctrl: [64, 32], tip: [79, 38], width: 1.3, amp: 1.2, ph: 2.7 },
    ];
    this.BASE_WRAP = [
      { pts: [[24.5, 27], [27, 29.5], [31, 30.5], [35, 28.5], [39, 26]], hws: [3.2, 3.6, 3.4, 3.2, 3.0] },
      { pts: [[30, 30], [31.5, 32.5], [33, 33.6]], hws: [1.8, 1.5, 1.0] },
    ];

    this.CLOAK_PAD = 8;
    this.cloakW = new Float32Array(this.KR * (this.KC + this.CLOAK_PAD));
    for (let r = 0; r < this.KR; r++) {
      for (let c = 0; c < this.KC + this.CLOAK_PAD; c++) {
        this.cloakW[r * (this.KC + this.CLOAK_PAD) + c] = this.smoothstep(this.KC * 0.63, this.KC * 0.97, c)
          * this.smoothstep(12, 22, r) * (1 - this.smoothstep(96, 106, r)) * (0.6 + 0.4 * this.smoothstep(40, 90, r));
      }
    }

    // Setup responsive grid
    this.setupGrid();
  }

  setupGrid() {
    const TAU = Math.PI * 2;
    const winW = Math.max(320, window.innerWidth || 800);
    const winH = Math.max(480, window.innerHeight || 600);
    const isPortrait = winH > winW;

    let ROWS, COLS, KX, KY, HORIZON;

    if (!isPortrait) {
      // Desktop / Laptop Landscape
      ROWS = Math.max(this.KNIGHT.rows, 120);
      COLS = Math.max(this.KNIGHT.cols, Math.round(ROWS * (this.CH / this.CW) * (winW / winH)));
      KX = Math.max(0, Math.floor((COLS - this.KNIGHT.cols) * (COLS > this.KNIGHT.cols + 15 ? 0.88 : 0.50)));
      KY = ROWS - this.KNIGHT.rows;
      HORIZON = 0.56;
    } else {
      // Mobile / Tablet Portrait: Match screen aspect ratio exactly to eliminate all letterboxing
      COLS = Math.max(this.KNIGHT.cols, 152);
      ROWS = Math.max(this.KNIGHT.rows, Math.round(COLS * (this.CW / this.CH) * (winH / winW)));
      KX = Math.max(0, Math.floor((COLS - this.KNIGHT.cols) * 0.50)); // Center knight
      KY = Math.max(10, Math.floor(ROWS * 0.16)); // Place knight gracefully in upper area
      HORIZON = 0.46; // Grass covers the lower 54% of screen
    }

    this.ROWS = ROWS;
    this.COLS = COLS;
    this.KX = KX;
    this.KY = KY;
    this.HORIZON = HORIZON;
    this.N = COLS * ROWS;

    const W = COLS * this.CW;
    const H = ROWS * this.CH;
    this.W = W;
    this.H = H;

    this.canvas.width = W;
    this.canvas.height = H;

    this.Xc = new Float32Array(COLS);
    this.Yr = new Float32Array(ROWS);
    for (let c = 0; c < COLS; c++) this.Xc[c] = (c + 0.5) * 0.5;
    for (let r = 0; r < ROWS; r++) this.Yr[r] = r + 0.5;

    this.lum = new Float32Array(this.N);
    this.rgb = new Float32Array(this.N * 3);
    this.isKnight = new Uint8Array(this.N);
    this.glyph = new Int8Array(this.N);

    // Deep-clone strands & wrap and offset by current (KX, KY)
    const OX = KX * 0.5, OY = KY;
    this.STRANDS = this.BASE_STRANDS.map(S => ({
      root: [S.root[0] + OX, S.root[1] + OY],
      ctrl: [S.ctrl[0] + OX, S.ctrl[1] + OY],
      tip: [S.tip[0] + OX, S.tip[1] + OY],
      width: S.width,
      amp: S.amp,
      ph: S.ph
    }));

    this.WRAP = this.BASE_WRAP.map(W => ({
      pts: W.pts.map(p => [p[0] + OX, p[1] + OY]),
      hws: [...W.hws]
    }));

    // Grass blades distributed across the lower field
    this.H0 = ROWS * HORIZON;
    this.P2 = 2 * this.LOOP;
    this.BLADES = [];
    const bladeCount = Math.round(COLS * 5.5);
    for (let k = 0; k < bladeCount; k++) {
      const depth = Math.pow(this.rnd(k, 1), 0.75);
      this.BLADES.push({
        x: this.rnd(k, 2) * COLS * 0.5,
        y: this.H0 + depth * (ROWS + 3 - this.H0),
        depth,
        h: (0.8 + 10 * this.GRASS_HEIGHT * depth * depth) * (0.45 + 1.0 * Math.pow(this.rnd(k, 3), 1.4)) * (0.8 + 0.2 * this.GRASS_HEIGHT),
        lean0: 0.15 + (this.rnd(k, 4) - 0.5) * 0.35,
        ph: this.rnd(k, 5) * TAU,
        tint: this.rnd(k, 6)
      });
    }
    this.BLADES.sort((a, b) => a.y - b.y);
    this.FRONT_FROM = this.BLADES.findIndex((B) => B.y > (isPortrait ? KY + this.KNIGHT.rows - 2 : ROWS - 4));

    // Floating fluff particles
    this.FLUFF = Array.from({ length: Math.round(COLS / 3.5) }, (_, k) => ({
      k,
      x0: this.rnd(k, 11) * COLS * 0.5,
      y0: this.H0 * (0.25 + 0.95 * this.rnd(k, 12)),
      laps: 1 + (k % 2),
      bob: 1 + 3 * this.rnd(k, 13),
      ph: this.rnd(k, 14) * TAU
    }));

    // Buffers and multi-scale glow canvases
    this.ascii = document.createElement("canvas");
    this.ascii.width = W;
    this.ascii.height = H;
    this.actx = this.ascii.getContext("2d");
    this.img = this.actx.createImageData(W, H);
    this.px32 = new Uint32Array(this.img.data.buffer);

    this.glowA = document.createElement("canvas");
    this.glowB = document.createElement("canvas");
    this.glowC = document.createElement("canvas");
    [[this.glowA, 2], [this.glowB, 4], [this.glowC, 8]].forEach(([g, s]) => {
      g.width = Math.ceil(W / s);
      g.height = Math.ceil(H / s);
    });

    this.SEG = new Float64Array(40 * 9);
    this.AV = Array.from({ length: 20 }, (_, k) => k / 19);
  }

  resize() {
    if (this.resizeDebounce) cancelAnimationFrame(this.resizeDebounce);
    this.resizeDebounce = requestAnimationFrame(() => {
      this.setupGrid();
    });
  }

  clamp(x, lo = 0, hi = 1) { return x < lo ? lo : x > hi ? hi : x; }
  smoothstep(a, b, x) { const t = this.clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); }
  hash3(a, b, c) {
    let h = (Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ Math.imul(c, 83492791)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  }
  rnd(k, n) { return this.hash3(k, n, 5150) / 4294967296; }
  lerp3(a, b, k) {
    k = this.clamp(k);
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  }

  setPixel(i, l, col) {
    this.lum[i] = l;
    this.isKnight[i] = 0;
    this.glyph[i] = -1;
    const j = i * 3;
    this.rgb[j] = col[0];
    this.rgb[j + 1] = col[1];
    this.rgb[j + 2] = col[2];
  }

  brush(pts, hws, av, fn) {
    const n = pts.length, ns = n - 1;
    let ymin = 1e9, ymax = -1e9, maxw = 0;
    for (let k = 0; k < n; k++) {
      ymin = Math.min(ymin, pts[k][1]);
      ymax = Math.max(ymax, pts[k][1]);
      maxw = Math.max(maxw, hws[k]);
    }
    for (let s = 0; s < ns; s++) {
      const o = s * 9, ax = pts[s][0], ay = pts[s][1], dx = pts[s + 1][0] - ax, dy = pts[s + 1][1] - ay;
      this.SEG[o] = ax; this.SEG[o + 1] = ay; this.SEG[o + 2] = dx; this.SEG[o + 3] = dy;
      this.SEG[o + 4] = 1 / (dx * dx + dy * dy + 1e-9);
      this.SEG[o + 5] = hws[s]; this.SEG[o + 6] = hws[s + 1] - hws[s];
      this.SEG[o + 7] = av[s]; this.SEG[o + 8] = av[s + 1] - av[s];
    }
    const r0 = Math.max(0, Math.floor(ymin - maxw - 1)), r1 = Math.min(this.ROWS, Math.ceil(ymax + maxw + 1));
    for (let r = r0; r < r1; r++) {
      const py = this.Yr[r];
      let rx0 = 1e9, rx1 = -1e9;
      for (let s = 0, o = 0; s < ns; s++, o += 9) {
        const pw = Math.max(this.SEG[o + 5], this.SEG[o + 5] + this.SEG[o + 6]) + 1;
        const ya = this.SEG[o + 1], yb = ya + this.SEG[o + 3];
        if (py < Math.min(ya, yb) - pw || py > Math.max(ya, yb) + pw) continue;
        const xa = this.SEG[o], xb = xa + this.SEG[o + 2];
        rx0 = Math.min(rx0, Math.min(xa, xb) - pw);
        rx1 = Math.max(rx1, Math.max(xa, xb) + pw);
      }
      if (rx0 > rx1) continue;
      const c0 = Math.max(0, Math.floor(rx0 * 2)), c1 = Math.min(this.COLS, Math.ceil(rx1 * 2));
      for (let c = c0; c < c1; c++) {
        const px = this.Xc[c];
        let best = 1, bestS = -1, bestU = 0;
        for (let s = 0, o = 0; s < ns; s++, o += 9) {
          const qx = px - this.SEG[o], qy = py - this.SEG[o + 1], dx = this.SEG[o + 2], dy = this.SEG[o + 3];
          let u = (qx * dx + qy * dy) * this.SEG[o + 4];
          u = u < 0 ? 0 : u > 1 ? 1 : u;
          const ex = qx - dx * u, ey = qy - dy * u;
          let hw = this.SEG[o + 5] + this.SEG[o + 6] * u;
          if (hw < 1e-3) hw = 1e-3;
          const q2 = (ex * ex + ey * ey) / (hw * hw);
          if (q2 < best) { best = q2; bestS = s; bestU = u; }
        }
        if (bestS < 0) continue;
        const o = bestS * 9, cr = this.SEG[o + 2] * (py - this.SEG[o + 1]) - this.SEG[o + 3] * (px - this.SEG[o]);
        fn(r * this.COLS + c, this.SEG[o + 7] + this.SEG[o + 8] * bestU, Math.sqrt(best) * (cr > 0 ? 1 : cr < 0 ? -1 : 0), r, c);
      }
    }
  }

  strandPoints(S, t) {
    const TAU = Math.PI * 2;
    const pts = [], hws = [];
    const [R, Cp, T] = [S.root, S.ctrl, S.tip];
    for (let i = 0; i < 20; i++) {
      const s = i / 19, u = 1 - s;
      const bx = u * u * R[0] + 2 * u * s * Cp[0] + s * s * T[0];
      const by = u * u * R[1] + 2 * u * s * Cp[1] + s * s * T[1];
      const tx = 2 * u * (Cp[0] - R[0]) + 2 * s * (T[0] - Cp[0]);
      const ty = 2 * u * (Cp[1] - R[1]) + 2 * s * (T[1] - Cp[1]);
      const tl = Math.hypot(tx, ty) + 1e-9, nx = -ty / tl, ny = tx / tl;
      const w1 = Math.sin(TAU * (1.3 * s - t / this.LOOP) + S.ph);
      const w2 = Math.sin(TAU * (2.6 * s - 2 * t / this.LOOP) + S.ph * 1.7);
      const d = this.WAVE * S.amp * (Math.pow(s, 1.35) * w1 + 0.35 * s * s * w2);
      pts.push([bx + nx * d, by + ny * d]);
      const twist = 0.78 + 0.22 * Math.sin(TAU * (1.7 * s - t / this.LOOP) + S.ph + 1);
      hws.push(S.width * (0.7 + 0.3 * Math.sin(Math.PI * Math.min(1, s * 1.2))) * twist * (1 - 0.25 * s));
    }
    return { pts, hws };
  }

  cloth(pts, hws, t, k, tatter, ph) {
    const TAU = Math.PI * 2;
    const FABRIC = 6;
    const lin = (n) => Array.from({ length: n }, (_, idx) => idx / (n - 1));
    this.brush(pts, hws, pts.length === 20 ? this.AV : lin(pts.length), (i, a, q, r, c) => {
      const thr = tatter ? this.smoothstep(0.82, 1.0, a) : 0;
      if (thr > 0) {
        const hn = this.hash3(Math.floor(a * 55), Math.floor((q + 1) * 2.5), k + 7) % 1000 / 1000;
        if (hn < thr * 0.45 || Math.abs(q) > 1 - 0.35 * thr * (this.hash3(Math.floor(a * 40), k, 3) % 1000 / 1000)) return;
      }
      const crest = 0.5 + 0.5 * Math.cos(TAU * (1.3 * a - t / this.LOOP) + ph + Math.PI / 2);
      const across = 0.92 + 0.08 * Math.cos(q * Math.PI);
      const rolled = 1 - 0.22 * this.smoothstep(0.72, 1, Math.abs(q));
      const l = (0.4 + 0.32 * crest) * across * rolled;
      const col = this.lerp3(this.RED_DARK, this.RED, 0.2 + 0.8 * crest);
      this.setPixel(i, l, col);
      this.glyph[i] = FABRIC + Math.max(0, Math.min(4, Math.floor((l - 0.26) / 0.1)));
    });
  }

  scarf(t) {
    const TAU = Math.PI * 2;
    const FABRIC = 6;
    this.STRANDS.forEach((S, k) => {
      const { pts, hws } = this.strandPoints(S, t);
      this.cloth(pts, hws, t, k, true, S.ph);
    });

    const wob = 0.35 * Math.sin(TAU * t / this.LOOP);
    this.WRAP.forEach((P, k) => {
      this.cloth(
        P.pts.map(([x, y], i) => [x, y + wob * Math.sin(i * 1.3 + k)]),
        P.hws,
        t,
        9 + k,
        false,
        0.7 + k
      );
    });

    const NP = 22;
    for (let p = 0; p < NP; p++) {
      const S = this.STRANDS[p % this.STRANDS.length];
      const ph = ((t / (this.LOOP * 2) + p / NP) % 1 + 1) % 1;
      const { pts } = this.strandPoints(S, t);
      const at = pts[Math.min(19, 14 + (this.hash3(p, 2, 9) % 6))];
      const dir = [S.tip[0] - S.ctrl[0], S.tip[1] - S.ctrl[1]], dl = Math.hypot(dir[0], dir[1]);
      const dist = ph * (6 + 10 * this.rnd(p, 3));
      const x = at[0] + dir[0] / dl * dist + 1.5 * Math.sin(TAU * ph * 2 + p);
      const y = at[1] + dir[1] / dl * dist - ph * (2 + 4 * this.rnd(p, 4));
      const c = Math.floor(x * 2), r = Math.floor(y);
      if (c < 0 || c >= this.COLS || r < 0 || r >= this.ROWS) continue;
      const i = r * this.COLS + c, l = 0.68 * (1 - 0.7 * ph) * this.smoothstep(0, 0.08, ph);
      if (l > this.lum[i]) {
        this.setPixel(i, l, this.RED);
        this.glyph[i] = FABRIC;
      }
    }
  }

  wind(x, t) {
    const TAU = Math.PI * 2;
    const gust = Math.pow(0.5 + 0.5 * Math.sin(TAU * (x / 60 - t / this.P2)), 3);
    return this.GRASS_WIND * (0.18 + 0.55 * gust + 0.12 * Math.sin(TAU * (x / 17 - 2 * t / this.P2) + 1.3));
  }

  blades(t, from, to) {
    const TAU = Math.PI * 2;
    const G_PIPE = 0, G_SLASH = 1, G_BACK = 2, G_TICK = 3, G_COMMA = 4, G_DOT = 5;

    for (let k = from; k < to; k++) {
      const B = this.BLADES[k], w = this.wind(B.x, t);
      let lean = B.lean0 + w * (0.6 + 0.6 * B.depth)
        + (0.35 * Math.sin(TAU * 3 * t / this.P2 + B.ph) + 0.15 * Math.sin(TAU * 5 * t / this.P2 + B.ph * 1.7)) * (0.5 + B.depth);
      lean = Math.max(-1.1, Math.min(1.5, lean));
      const sheen = Math.pow(0.5 + 0.5 * Math.sin(TAU * (B.x / 60 - t / this.P2) - 0.3), 3);
      const h = k >= this.FRONT_FROM && this.FRONT_FROM >= 0 ? Math.min(B.h, 10) : B.h;
      const steps = Math.max(1, Math.round(h));
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const x = B.x + lean * h * 0.55 * u * u, y = B.y - h * u;
        const r = Math.floor(y), c = Math.floor(x * 2);
        if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) continue;
        const i = r * this.COLS + c;
        const slope = 2.2 * lean * u;
        const g = B.depth < 0.1 ? (u > 0.5 ? G_TICK : G_DOT) : u > 0.9 && steps > 2 ? (slope > 0.5 ? G_TICK : G_COMMA)
          : slope > 0.6 ? G_SLASH : slope < -0.6 ? G_BACK : G_PIPE;
        const l = (0.12 + 0.32 * B.depth) * (0.7 + 0.3 * u) * (0.75 + 0.7 * sheen * u);
        let col = this.lerp3(this.GRASS_FAR, this.GRASS_NEAR, B.depth);
        col = this.lerp3(col, this.GRASS_TIP, u * u * (0.25 + 0.35 * B.tint) + 0.45 * sheen * u);
        if (l >= this.lum[i]) {
          this.setPixel(i, l, col);
          this.glyph[i] = g;
        }
      }
    }
  }

  fluff(t) {
    const TAU = Math.PI * 2;
    const G_DOT = 5, FABRIC = 6;
    const span = this.COLS * 0.5;
    for (const F of this.FLUFF) {
      const x = (F.x0 + span * F.laps * t / this.P2) % span;
      const y = F.y0 + F.bob * Math.sin(TAU * t / this.P2 + F.ph);
      const r = Math.floor(y), c = Math.floor(x * 2);
      if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) continue;
      const i = r * this.COLS + c;
      if (this.lum[i] < 0.1) {
        this.setPixel(i, 0.42, this.GRASS_TIP);
        this.glyph[i] = F.k % 3 ? G_DOT : FABRIC;
      }
    }
  }

  sampleKnight(x, y) {
    if (x < 0 || y < 0 || x > this.KC - 1 || y > this.KR - 1) return 0;
    const c0 = Math.floor(x), r0 = Math.floor(y), c1 = Math.min(this.KC - 1, c0 + 1), r1 = Math.min(this.KR - 1, r0 + 1);
    const fx = x - c0, fy = y - r0;
    return (this.knightLum[r0 * this.KC + c0] * (1 - fx) + this.knightLum[r0 * this.KC + c1] * fx) * (1 - fy)
         + (this.knightLum[r1 * this.KC + c0] * (1 - fx) + this.knightLum[r1 * this.KC + c1] * fx) * fy;
  }

  scene(t) {
    const TAU = Math.PI * 2;
    this.lum.fill(0);
    this.glyph.fill(-1);
    this.isKnight.fill(0);

    this.blades(t, 0, this.FRONT_FROM < 0 ? this.BLADES.length : this.FRONT_FROM);
    this.fluff(t);

    const breath = this.BREATH * (0.5 - 0.5 * Math.cos(TAU * t / this.P2));
    const sway = this.SWAY * Math.sin(TAU * t / this.P2 + 0.8);

    for (let r = 0; r < this.KR; r++) {
      const wgt = this.smoothstep(this.KR * 0.92, this.KR * 0.35, r);
      const rowLift = r + breath * wgt, rowSway = sway * wgt * wgt;
      for (let c = 0; c < this.KC + this.CLOAK_PAD; c++) {
        const tc = c + this.KX;
        if (tc >= this.COLS) break;
        const w = this.cloakW[r * (this.KC + this.CLOAK_PAD) + c];
        let dx = 0, dy = 0;
        if (w > 0) {
          dx = this.CLOAK * w * (0.35 + 0.55 * Math.sin(TAU * (t / this.LOOP - r / 22 - c / 45))
                           + 0.3 * Math.sin(TAU * (2 * t / this.LOOP - r / 9) + 1.1));
          dy = 0.35 * this.CLOAK * w * Math.sin(TAU * (t / this.LOOP - c / 16) + 0.5);
        }
        const sx = c - dx + rowSway, sy = rowLift - dy;
        const L = this.sampleKnight(sx, sy);
        const i = (r + this.KY) * this.COLS + tc, j = i * 3;
        if (L < 0.06) {
          const mr = Math.round(sy), mc = Math.round(sx);
          if (mr >= 0 && mr < this.KR && mc >= 0 && mc < this.KC && this.knightMask[mr * this.KC + mc]) {
            this.lum[i] = 0;
          }
          continue;
        }
        this.lum[i] = L;
        this.glyph[i] = -1;
        this.isKnight[i] = 1;
        this.rgb[j] = this.KNIGHT_RGB[0];
        this.rgb[j + 1] = this.KNIGHT_RGB[1];
        this.rgb[j + 2] = this.KNIGHT_RGB[2];
      }
    }

    if (this.FRONT_FROM >= 0) this.blades(t, this.FRONT_FROM, this.BLADES.length);
    this.scarf(t);
  }

  draw() {
    this.px32.fill(0);
    const W = this.W, H = this.H;
    const CH = this.CH, CW = this.CW;

    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const i = r * this.COLS + c, L = this.lum[i];
        let m;
        if (this.glyph[i] >= 0) {
          m = this.MASKS[this.GRASS0 + this.glyph[i]];
        } else {
          let level = 0;
          while (level < this.LEVELS.length && L >= this.LEVELS[level]) level++;
          if (level === 0) continue;
          m = this.MASKS[this.START[level] + this.hash3(r, c, 1) % this.COUNT[level]];
        }
        const k = (this.isKnight[i] ? 0.9 : 0.6 + 0.45 * L) * 255, j = i * 3;
        const pr = Math.min(255, this.rgb[j] * k) | 0;
        const pg = Math.min(255, this.rgb[j + 1] * k) | 0;
        const pb = Math.min(255, this.rgb[j + 2] * k) | 0;
        const col = (pb << 16) | (pg << 8) | pr;
        let o0 = (r * CH) * W + c * CW, mi = 0;
        for (let y = 0; y < CH; y++, o0 += W) {
          for (let x = 0; x < CW; x++, mi++) {
            const v = m[mi];
            if (v) this.px32[o0 + x] = (v << 24) | col;
          }
        }
      }
    }

    this.actx.putImageData(this.img, 0, 0);
    this.ctx.globalCompositeOperation = "source-over";
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = `rgb(${this.BG.join(",")})`;
    this.ctx.fillRect(0, 0, W, H);
    this.ctx.drawImage(this.ascii, 0, 0);

    if (this.GLOW > 0) {
      let src = this.ascii;
      for (const g of [this.glowA, this.glowB, this.glowC]) {
        const gx = g.getContext("2d");
        gx.clearRect(0, 0, g.width, g.height);
        gx.drawImage(src, 0, 0, g.width, g.height);
        src = g;
      }
      this.ctx.globalCompositeOperation = "lighter";
      this.ctx.globalAlpha = this.GLOW;
      this.ctx.drawImage(this.glowC, 0, 0, W, H);
      this.ctx.globalCompositeOperation = "source-over";
      this.ctx.globalAlpha = 1;
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.t0 = performance.now();
    this.lastDraw = -1e9;

    const tick = (now) => {
      if (!this.isRunning) return;
      if (now - this.lastDraw >= 1000 / this.FPS - 2) {
        this.lastDraw = now;
        this.scene((now - this.t0) / 1000);
        this.draw();
      }
      this.animId = requestAnimationFrame(tick);
    };
    this.animId = requestAnimationFrame(tick);
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}
