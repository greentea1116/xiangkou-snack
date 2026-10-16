window.XIANGKOU_PRODUCTS = [
  { id: "crispy-original-cake", category: "cake", name: "原味脆皮雞蛋糕", desc: "外層薄脆、內裡鬆軟。", price: 50, unit: "份" },
  { id: "crispy-matcha-cake", category: "cake", name: "抹茶脆皮雞蛋糕", desc: "淡淡茶香，甜度清爽。", price: 60, unit: "份" },
  { id: "crispy-chocolate-cake", category: "cake", name: "巧克力脆皮雞蛋糕", desc: "濃郁巧克力香。", price: 60, unit: "份" },
  ...[
    ["cabbage", "高麗菜", 30, "份", "清甜爽口"],
    ["greens", "青江菜", 30, "份", "新鮮葉菜"],
    ["enoki", "金針菇", 30, "份", "吸附滷汁的好搭配"],
    ["kelp", "海帶", 20, "份（2片）", "經典滷味配菜"],
    ["tofu", "豆干", 20, "份（2塊）", "豆香入味"],
    ["tofu-skin", "豆皮", 25, "份", "軟嫩吸汁"],
    ["egg", "滷蛋", 15, "顆", "經典滷香"],
    ["pork-ball", "貢丸", 20, "份（2顆）", "彈牙肉香"],
    ["fish-cake", "甜不辣", 25, "份（2片）", "Q彈魚漿"],
    ["rice-cake", "米血糕", 25, "份", "軟Q飽足"],
    ["chicken-wing", "雞翅", 30, "支", "滷香下飯"],
    ["chicken-feet", "雞腳", 30, "份（3支）", "軟嫩入味"],
    ["gizzard", "雞胗", 35, "份", "爽脆口感"],
    ["pork-ear", "豬耳朵", 40, "份", "脆口滷香"],
    ["noodles", "王子麵", 20, "包", "加麵更有飽足感"]
  ].map(([id, name, price, unit, desc]) => ({ id: "luwei-" + id, category: "luwei", name: "滷味・" + name, price, unit, desc })),
  ...[
    ["radish", "白蘿蔔", 20, "塊", "清甜湯煮"],
    ["cabbage", "高麗菜", 30, "份", "清甜蔬菜"],
    ["kelp", "昆布結", 15, "個", "海味清香"],
    ["corn", "玉米", 25, "段", "清甜多汁"],
    ["egg", "水煮蛋", 15, "顆", "湯煮蛋香"],
    ["tofu", "油豆腐", 20, "份（2塊）", "軟嫩吸湯"],
    ["pork-ball", "貢丸", 20, "串（2顆）", "彈牙肉香"],
    ["fish-ball", "魚丸", 20, "串（2顆）", "鮮甜魚漿"],
    ["fish-cake", "黑輪", 20, "條", "經典關東煮"],
    ["chikuwa", "竹輪", 20, "條", "Q彈中空魚漿"],
    ["rice-cake", "米血糕", 25, "份", "軟Q口感"],
    ["konjac", "蒟蒻", 20, "份", "滑嫩爽口"],
    ["cabbage-roll", "高麗菜捲", 35, "個", "蔬菜包裹肉餡"],
    ["mochi-pouch", "麻糬福袋", 35, "個", "豆皮包裹軟糯麻糬"]
  ].map(([id, name, price, unit, desc]) => ({ id: "oden-" + id, category: "oden", name: "關東煮・" + name, price, unit, desc }))
];
