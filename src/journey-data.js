(function(root){
'use strict';
const CAST={hero:{name:'林舟',role:'归来的守灯人',portrait:'hero'},father:{name:'林远',role:'父亲 · 修灯匠',portrait:'father'},mother:{name:'沈宁',role:'记忆里的母亲',portrait:'mother'},suwan:{name:'苏晚',role:'想修复旧书的人',portrait:'suwan'},brother:{name:'林澄',role:'失联的弟弟',portrait:'hero'},doctor:{name:'米娅',role:'村医',portrait:'mother'},scribe:{name:'闻叔',role:'记录员',portrait:'father'},narrator:{name:'归途手札',role:'旁白',portrait:'narrator'}};
const ITEMS={wood:{name:'木材',icon:'♧'},herb:{name:'草药',icon:'❦'},grain:{name:'谷物',icon:'♙'},mushroom:{name:'山菌',icon:'♠'},ore:{name:'矿石',icon:'◆'},seed:{name:'种子',icon:'•'},stew:{name:'菌菇热汤',icon:'♨'},tea:{name:'暖心茶',icon:'♧'},roast:{name:'香烤谷饼',icon:'◉'},trap:{name:'绊索陷阱',icon:'⌘'}};
const WEAPONS={sword:{name:'旧日短剑',description:'均衡连击，适合打断和近身周旋。',range:72,arc:1.3,damage:24,speed:.46,stamina:12},spear:{name:'守路长矛',description:'攻击距离长，正面窄；观察冲刺后反击。',range:115,arc:.45,damage:29,speed:.65,stamina:15},axe:{name:'破障重斧',description:'起手较慢，强力破甲；为收招留出空间。',range:77,arc:1.6,damage:44,speed:.9,stamina:24}};
const RECIPES={stew:{name:'菌菇热汤',cost:{mushroom:2,herb:1},description:'恢复生命，适合受伤后补给。'},tea:{name:'暖心茶',cost:{herb:2},description:'恢复魔力并提供保暖效果，为寒地施法做准备。'},roast:{name:'香烤谷饼',cost:{grain:2,mushroom:1},description:'远行口粮，提高下一段战斗的持续力。'},trap:{name:'绊索陷阱',cost:{wood:2,ore:1},description:'部署在来路上，限制冲锋敌人。'}};
const BUILDINGS={kitchen:{name:'修复灶台',cost:{wood:4,ore:2},description:'让营地烹饪更有效率。'},workshop:{name:'修缮工坊',cost:{wood:5,ore:4},description:'改善武器和远行装备。'},house:{name:'修补老屋',cost:{wood:6,ore:2},description:'归来时有安稳的落脚处。'},garden:{name:'整理菜圃',cost:{wood:3,seed:1},description:'种植补给；成长随冒险推进，无需现实等待。'}};
const L=(...pairs)=>{const a=[];for(let i=0;i<pairs.length;i+=2)a.push({speaker:pairs[i],text:pairs[i+1]});return a;};
const N=(id,title,type,description,lines,extra={})=>({id,title,type,description,lines,after:[],reward:{xp:type==='boss'?120:['battle','defend'].includes(type)?70:40,items:{wood:1,herb:1}},...extra});
const choice=(id,label,flag,bond,trust,text)=>({id,label,effect:{flag,bond,trust},result:L('narrator',text)});
const CHAPTERS=[];const SIDEQUESTS=[];
CHAPTERS.push({id:0,title:'灯下的空椅',region:'萤火村',subtitle:'回来，不等于已经回到家。',palette:{ground:'#294b38',path:'#8c815e',water:'#386f69',accent:'#edc98a'},weather:'clear',decorSeed:21,intro:L('narrator','离家的第三年，林舟收到父亲的信：灯坏了，能回来一趟吗。','hero','我把路上的见闻想了很多遍。推开门时，却只问了一句：还有饭吗。'),outro:L('father','旧花园的音乐盒还在。你娘说，东西坏了，可以慢慢修。人也是。'),nodes:[
N('home_table','第三只蓝杯','talk','与父亲谈谈桌上的空位。',L('father','饭还热着。你坐原来的位置。','hero','这只蓝杯……阿澄的东西，你还留着？','father','没坏。收起来做什么。','narrator','父亲把第三副碗筷挪到柜边，却没有把椅子推回桌下。'),{choices:[choice('listen','先坐下，问父亲这些年过得怎样。','father_listened',0,2,'林舟没有急着谈修灯。父亲说起漏雨的屋角，也说自己已经很久没做过三个人的饭。'),choice('repair','先把门修好，再陪父亲吃饭。','father_repaired',1,1,'父亲替他扶着木板。这一次，林舟没有把干活当成躲开谈话的理由。')]}),
N('home_shed','旧棚里的动静','battle','清理被野兽占据的工具棚。',L('father','棚里有长矛和重斧。剑快，矛远，斧子能砸开硬壳。','hero','你以前只肯让我拿木剑。','father','那时我怕你受伤。现在也怕。可不能因为怕，就让你什么都不会。'),{enemies:['wolf','shell'],waves:1,after:L('hero','工具柄上都缠了新布。原来你一直在替有人回来做准备。')}),
N('home_records','药簿缺了一页','investigate','听米娅讲述母亲最后的冬天。',L('doctor','你母亲那年冬天没有一直卧床。她去过北边矿站，给撤出来的人换药。','hero','父亲说她病了很久。','doctor','两句话可能都是真的。可病人不能因为会照顾别人，就不再需要被照顾。','narrator','药簿里有一页被整齐裁走。残留的字迹，是“林澄，转送”。')),
N('home_signal','三盏回家的灯','puzzle','按旧路标的次序点灯。',L('father','路标从河边开始：先亮船灯，再亮窗灯，最后才是山顶那盏。','hero','小时候我们总抢着点最后一盏。','father','阿澄抢不过你，就把船灯点得特别亮。'),{puzzle:{kind:'sequence',clue:'沿河归家：船灯 → 窗灯 → 山灯。',labels:['山灯','船灯','窗灯'],solution:[1,2,0]},after:L('narrator','三处灯影接成一条线。它照亮旧路，也照见门槛上两双不同大小的刻痕。')}),
N('home_watch','今晚有人守夜','defend','保护村口的运药车。',L('doctor','药车被夜里的影兽追到了村口。别站在它们冲来的直线上。','hero','我去前面，你把人带进屋。','doctor','好。可你也属于我要带回来的人。'),{enemies:['wolf','spitter'],waves:2,after:L('father','你守住了路。明天出门，把热汤也带上。逞强不是第二把武器。')}),
N('home_letter','信封里的第二层纸','talk','向苏晚问起旧花园的线索。',L('suwan','你父亲的信是我帮忙寄的。最初他写了六页，最后只留下灯坏了。','hero','他为什么不写想我？','suwan','也许和你为什么从不写想家，是同一个原因。','hero','我想先去花园。回来以后，我愿意听那六页。'))
]});
CHAPTERS.push({id:1,title:'没有署名的人',region:'暮萤旧林',subtitle:'有些信，写给没来得及成为的自己。',palette:{ground:'#243d34',path:'#6b7151',water:'#284b49',accent:'#bdd894'},weather:'fog',decorSeed:42,intro:L('narrator','旧花园的门没有上锁。母亲种的花已经越过篱笆，开到了别人走的路上。'),outro:L('hero','她想过离开，也选择过留下。我第一次认识那个不只是母亲的沈宁。'),nodes:[
N('forest_box','没有署名的乐谱','investigate','寻找音乐盒缺失的谱页。',L('hero','这首曲子后面写着一个我没听过的地名：栖潮港。','scribe','你娘年轻时收到过那里乐团的邀请。她留下了，没告诉孩子们。','hero','是为了我们？','scribe','别急着替她解释。她留下过自己的话。')),
N('forest_resin','树脂与火星','battle','清理缠住木桥的硬壳兽。',L('suwan','硬壳挡在正面，用重斧破开，或绕到它转身的时候。','hero','地上都是湿树脂。','suwan','别急着点火。先把它们引离那棵还活着的小树。'),{enemies:['shell','spitter','wolf'],waves:2,after:L('narrator','路边留下新的斧痕。苏晚把折断的枝条扎起来，树梢还有一片绿色。')}),
N('forest_lullaby','母亲教过的晚安','puzzle','重排音乐盒的三个音符。',L('mother','雨先敲窗，风再穿林，最后的灯替我说晚安。','hero','我把曲子记成了灯先亮。因为我总等不及最后一句。','suwan','那就重新听一遍。你现在有时间了。'),{puzzle:{kind:'sequence',clue:'雨敲窗 → 风穿林 → 灯说晚安。',labels:['雨','灯','林'],solution:[0,2,1]},after:L('mother','别把一辈子都用来补那一天。你要好好吃饭，好好爱人。')}),
N('forest_grove','给谁留下的花园','talk','决定旧花园今后的用途。',L('scribe','有人想把这里封起来，留个完整的样子。也有人想让村里的孩子来种东西。','hero','我怕他们弄坏母亲留下的花。','suwan','她种花时，会不会也盼着有人经过？','hero','我不能再替她给所有人关门。'),{choices:[choice('open','开放一半花园，让孩子们共同照料。','forest_open',0,2,'旧木牌写上了每个照料者的名字。母亲的花多了新的邻居。'),choice('protect','保留旧花圃，在旁边开辟公共菜地。','forest_protected',1,1,'旧曲子仍有安静的角落。新的菜圃则属于今天还要吃饭的人。')]}),
N('forest_path','雾里不熄的铃','defend','守住闻叔修复的路铃。',L('scribe','雾中的影兽会追着铃声来。守住这处岔口，我才能把迷路的人引回去。','hero','远处吐雾的先处理，别让它们把路堵死。','suwan','我守另一边。我们不用总站在同一个地方，才算一起。'),{enemies:['spitter','burrow','wolf'],waves:2,after:L('scribe','最后一个孩子回来了。他问门口的花是谁种的，我终于说出了你娘的名字。')}),
N('forest_address','信纸背面的海','talk','读完母亲留下的未寄信。',L('mother','我年轻时想去海边演奏，后来在这里遇见了值得留下的人。留下是我的选择，遗憾也是。','hero','原来她并不是从来没有遗憾。','suwan','有遗憾，不代表她不爱这个家。','narrator','信纸背面写着一个地址。下面有阿澄歪斜的字：等我找到船，带你一起去。'))
]});
CHAPTERS.push({id:2,title:'两个人的远方',region:'风语芦泽',subtitle:'陪伴，是问清对方想去哪里。',palette:{ground:'#304c49',path:'#647467',water:'#365f69',accent:'#e7b3a0'},weather:'rain',decorSeed:64,intro:L('suwan','我已经申请了栖潮港的旧书修复工坊。三年前没有走，不代表我永远不想走。'),outro:L('narrator','河灯远去时，两个人都没有说永远。他们约好，下一封信要写具体的日子。'),nodes:[
N('marsh_departure','行囊已经收好','talk','与苏晚谈谈她的计划。',L('hero','你为什么没有早点告诉我？','suwan','我写过。你回信说等你安顿好，就带我过好日子。那封信里没有我的问题。','hero','我把自己的承诺，当成了你的答案。','suwan','现在问，还来得及。'),{choices:[choice('independent','支持她先去工坊，约定彼此探望。','suwan_independent',2,0,'苏晚第一次把工坊的邀请函完整展开。她希望被牵挂，也希望被相信。'),choice('together','一起去海港，但各自决定自己的生活。','suwan_together',1,1,'两张行程表被放在一起，没有被改成同一张。共同的路也容得下不同的目的地。')]}),
N('marsh_rain','雨中的远袭','battle','击退芦苇深处的吐雾兽。',L('suwan','雨会让雷光传得更远。可别在敌人的蓄力圈里停留。','hero','先逼它们移动，再从侧面突进。','narrator','水面映出几处不属于星星的光。每次发亮，都先于一次袭击。'),{enemies:['spitter','wisp','wolf'],waves:2,after:L('hero','我以前觉得准备食物是耽误赶路。现在知道，能继续走的力气也是路的一部分。')}),
N('marsh_ferry','没有船夫的渡口','investigate','检查旧渡船留下的乘客记录。',L('scribe','矿站撤离那晚，渡船没有按册子上记的时间出发。还有一班临时药船。','hero','乘客里有没有林澄？','scribe','这里写的是小澄。右手受伤，抱着一只蓝杯。','narrator','字迹潦草，却让一个被说成结束的故事重新开了口。')),
N('marsh_sluice','让水先找到路','puzzle','调整三处水闸，恢复通往桥边的浅滩。',L('suwan','闸门上的刻字还在：东口迎水，北槽蓄水，西口放行。','hero','不能一起打开，否则水会冲回渡口。','suwan','先把方向排好，再让它们一起转。'),{puzzle:{kind:'rotate',clue:'左闸朝东，中闸朝北，右闸朝西。方向编号：北、东、南、西。',labels:['北','东','南','西'],solution:[1,0,3]},after:L('narrator','水缓下来，露出三年前被淹没的脚印。有人曾在这里，努力走向另一边。')}),
N('marsh_lantern','护住她写下的愿望','defend','守护河灯和渡口的归路。',L('suwan','灯里写的是我的愿望：修好别人舍不得丢的书，也写一本自己的。','hero','我守前面的路。你觉得危险，就叫我回来。','suwan','你也是。别总把求助留给别人。'),{enemies:['wolf','burrow','wisp'],waves:3,after:L('suwan','灯没熄。以后遇见难走的路，我们也可以分开处理，再在前面会合。')}),
N('marsh_message','递给活人的信','talk','把新的线索寄回家。',L('hero','我想告诉父亲，阿澄可能还活着。又怕让他白等。','suwan','说你知道的，也说你还不知道的。希望不需要假装成保证。','hero','爹，我们找到一班药船的记录。我会继续查。今晚别一个人等到太晚。','narrator','这一封信，林舟写了整整两页。最后一句是：我也想你。'))
]});
CHAPTERS.push({id:3,title:'被涂掉的名字',region:'沉钟矿井',subtitle:'真相不是武器，也不该成为秘密的借口。',palette:{ground:'#303b40',path:'#706a61',water:'#354c58',accent:'#cba981'},weather:'cold',decorSeed:87,intro:L('narrator','矿井停工三年。入口的纪念碑上，有一行字被重新凿平，又写上了新的名字。'),outro:L('hero','我来时想找一个人负责。离开时，开始懂得责任不能只落在最愿意认错的人身上。'),nodes:[
N('mine_register','两份撤离名单','investigate','比对药簿、乘船记录与矿站名单。',L('doctor','矿站写“全员离开”，药船却晚了四十分钟。两份名单不能同时完整。','scribe','被抹去的不是死者，是救援回来的人。他们没有按命令撤离。','hero','父亲的签名在封门许可上。','scribe','而你母亲的名字，在第二次入井的名单上。')),
N('mine_armour','铁壳的空隙','battle','穿过矿井的废弃装载区。',L('hero','它们正面的矿壳太厚，剑刃只留下白痕。','doctor','用重斧，或者等它重击落空。厚壳背后没有第二层甲。','narrator','支架在回声里轻颤。每一次贪刀，都可能把下一次躲避的余地耗尽。'),{enemies:['shell','shell','burrow'],waves:2,after:L('hero','赢得慢一点，也比没有力气走回来好。')}),
N('mine_bells','最后一次敲钟','puzzle','根据三个证据判断撤离先后。',L('scribe','工钟停在八点。药船日志是八点二十分，封门签字是八点四十。','hero','所以不是封门后才有人离开。父亲等到了药船，可名单没有记录第二次入井的人。','doctor','把事件依次排列，别让一张名单替所有人说话。'),{puzzle:{kind:'sequence',clue:'工钟八点；药船八点二十分；封门八点四十。',labels:['封门','工钟停摆','药船出发'],solution:[1,2,0]},after:L('narrator','事实没有替谁抹去错误。它让错误终于有了可以面对的形状。')}),
N('mine_testimony','谁有权知道','talk','决定如何处理被删改的记录。',L('scribe','我删掉他们的名字，怕救人的人被追责。后来大家问起，我连实话也不敢说了。','hero','被保护的人，也失去了替自己说话的机会。','doctor','公开前，让幸存者知道会发生什么。真相不该再次越过他们。'),{choices:[choice('public','请幸存者同意后，公开全部经过。','truth_public',0,2,'记录员开始逐户征求意见。纪念碑会添上被抹去的人，也会留下这次更正的缘由。'),choice('witnesses','先召开见证人会谈，再共同决定公开范围。','truth_witnesses',1,1,'名单暂时交给见证人保管。保密不再由一个人决定，每位当事人都有说话的位置。')]}),
N('mine_archive','把名字带出去','defend','保护记录室里尚未撤出的资料。',L('doctor','地下的影兽被钟声惊醒了。别让它们冲进记录室。','hero','闻叔，拿最难重写的原件。其余的，我记在手札里。','scribe','这一次我不会把任何人的名字偷偷划掉。'),{enemies:['shell','spitter','burrow'],waves:3,after:L('narrator','灰尘落在药簿上，露出最后一页：林澄，右手保留，转栖潮港疗养。')}),
N('mine_father','隔着山的道歉','talk','听父亲说明当年的决定。',L('father','我以为所有人都出来了。签字时，我只想让井外的人活下来。后来知道你娘又进去了，我再也没敢问那扇门。','hero','娘选择了回去，你做过错误的判断。这两件事都不能被一句“都是我的错”盖住。','father','我没寄那封叫你回来的信，是怕你也走进来。不是为了你的前程，是我怕再失去一个。','hero','爹，我会回来。但以后，别替我决定什么真相是我能承受的。'),{after:L('doctor','你母亲后来也被救了出来。她在伤病中撑过了那个冬天，最后是在家里离开的。她不是一扇门后模糊的牺牲，是一个值得被完整记住的人。')})
]});
CHAPTERS.push({id:4,title:'海在信的背面',region:'栖潮旧港',subtitle:'找回一个人，不是把他放回原来的位置。',palette:{ground:'#36515a',path:'#b1a17f',water:'#347a8c',accent:'#e7cf95'},weather:'clear',decorSeed:109,intro:L('narrator','海港的木牌写满来去的船名。林舟找了很久，才意识到弟弟可能已经不用家里的小名。'),outro:L('brother','我会回去。不是因为过去必须补完整，是因为现在的我，也想坐在那张桌边。'),nodes:[
N('harbor_cup','蓝杯在窗台上','investigate','寻找药船照顾过的年轻木工。',L('suwan','窗台上那只杯子，和你家的缺口一样。','hero','阿澄！','brother','哥。你比我想的来得晚，也比我想的年轻。','narrator','林澄右手的两根手指不能完全伸直。他把刨子换到左手，没有藏起那道疤。')),
N('harbor_piers','潮水没有偏心','battle','清理阻挡船坞通道的潮影。',L('brother','潮影退一步，不一定是在逃。它会等水声把你的脚步盖过去。','hero','你怎么知道这么多？','brother','因为我在这里生活，不只是等人来找。'),{enemies:['burrow','wisp','spitter'],waves:2,after:L('hero','我总想着把你带回去，却还没问你在这里过得怎么样。')}),
N('harbor_unopened','寄出又退回的信','talk','听林澄讲他没有回家的原因。',L('brother','我寄过三封信。第一封地址被水泡烂了，第二封退回，第三封我没寄。','hero','为什么？','brother','大家都说我能活下来，是娘替我换来的。我不知道回家后，要怎样过每一天才算值得。','hero','你不需要把自己活成一份偿还。'),{choices:[choice('home','邀请他回家，也承认他可以再离开。','brother_home',1,1,'林澄答应回去吃一顿饭。他没有被要求立刻收起在海港建立的生活。'),choice('sea','先陪他在港口生活一天，再让他决定。','brother_sea',2,0,'林舟学着替弟弟扶木板。第一次，弟弟是带路的人，哥哥学着跟上。')]}),
N('harbor_tides','灯塔的旧航图','puzzle','按潮汐观测记录排列灯号。',L('brother','修船的人不用最亮的灯认路，要看变化的顺序。','suwan','记录写着：低潮见礁，中潮见桥，满潮只见远灯。','hero','母亲谱子上的三个记号，原来是一张海图。'),{puzzle:{kind:'sequence',clue:'潮水从低到高：礁石 → 木桥 → 远灯。',labels:['远灯','礁石','木桥'],solution:[1,2,0]},after:L('narrator','航图指向山后的记忆塔。母亲曾在那里收集老人的歌，没有留下复活任何人的方法。')}),
N('harbor_workshop','为别人的明天守门','defend','保护苏晚报到的旧书工坊。',L('suwan','里面是灾后抢救的书。它们不能再浸一次水。','hero','我帮你守住门。不是因为你要留下，是因为这是你想做的事。','suwan','这句话，我会记得很久。'),{enemies:['wolf','spitter','shell'],waves:3,after:L('suwan','师傅让我下个月来。我会回村一起处理眼前的事，但这次，我不会把邀请函藏起来。')}),
N('harbor_stormletter','家里寄来的求助','talk','读父亲第一次直接求助的信。',L('father','山里的雨到了村口。老屋漏得厉害，村民都来帮忙，可我还是有些怕。','hero','他终于没有写灯坏了。','brother','哥，这次一起回去吧。','narrator','父亲在信末写：想你们了。能回来帮我吗。字迹没有往常稳，却比往常轻。'))
]});
CHAPTERS.push({id:5,title:'不完美的家',region:'雨夜归村',subtitle:'一个家，不该靠一个人撑住。',palette:{ground:'#253a45',path:'#68717a',water:'#35495f',accent:'#e5bb82'},weather:'rain',decorSeed:132,intro:L('narrator','雨把村庄变成一座会呼吸的岛。门口亮着许多灯，已经不只林远家的一盏。'),outro:L('father','房子还要慢慢修。今晚先坐下来，吃一顿不赶时间的饭。'),nodes:[
N('storm_reunion','第三张椅子','talk','让父亲与林澄见面。',L('father','阿澄……你的手。','brother','不太灵便，但能做船。爹，别只看它坏掉的地方。','father','我替你把杯子洗过很多次。总觉得洗干净，你就会回来。','brother','我回来了。杯子不用再等我，饭也不用。')),
N('storm_shelter','把门开给别人','defend','守护临时避雨点。',L('doctor','药不够给每个人预备一整箱，但可以按需要分。先让老人和孩子进屋。','hero','我去守路口。','father','我会让别人帮我搭棚。你回来时，我不会还一个人站在雨里。'),{enemies:['wolf','burrow','spitter'],waves:3,after:L('narrator','三家的桌子拼在了一起。孩子们把长凳叫作一艘船，所有人都被允许上来。')}),
N('storm_roof','谁来扛最后一根梁','talk','与家人决定接下来的分工。',L('hero','我可以守外面的路，也可以修屋顶。你们都休息。','suwan','你听起来像当年的父亲。','brother','哥，我们不是回来站在你身后看的。','hero','那我们把每个人能做、想做的事都说清楚。'),{choices:[choice('share','让每个人承担一部分，安排轮换。','share_burden',1,2,'弟弟负责支架，父亲负责灯线，苏晚组织避雨点。之后的战斗会有村民替他们挡住部分增援。'),choice('line','由我守最危险的口，其余人统一后援。','hold_line',2,1,'他们尊重林舟的决定，也给他做了更坚固的护具。守在前面不再意味着孤立无援。')]}),
N('storm_drain','雨水该往哪里去','puzzle','调整排水槽，保护避雨点。',L('brother','东槽接屋檐，南槽下坡，西槽回河。北边是避雨点，不能朝那边。','father','我以前习惯自己试，觉得解释太费时间。','brother','告诉我方向，比你一个人爬三次屋顶快。'),{puzzle:{kind:'rotate',clue:'左槽向东，中槽向南，右槽向西；北方是避雨点。',labels:['北','东','南','西'],solution:[1,2,3]},after:L('father','你做得比我好。说出来，好像也没有那么难。')}),
N('storm_root','被水唤醒的根','boss','击退堵住村口的根潮。',L('scribe','记忆塔的根脉在吸走灯火。它把人不肯放手的过去，当成继续生长的养料。','hero','我们的过去不是错。但不能让它把今天的人吞下去。','suwan','一起看它的起手。重击落下以后，才轮到我们。'),{enemies:['boss','wisp'],waves:2,after:L('narrator','雨还在下，根潮却退了。村庄没有恢复成从前的样子，而是开始长出新的模样。')}),
N('storm_dinner','一顿会凉掉的饭','talk','与家人一起吃饭。',L('father','你娘最后那天，问你会不会怪她没等到你。','hero','我一直以为，是她在等我道歉。','brother','她最后还惦记着让所有人好受一点。我们能不能让她歇一歇？','narrator','这顿饭没有谁负责把所有沉默填满。菜凉了一次，又被一起热好。'))
]});
CHAPTERS.push({id:6,title:'替明天留一盏灯',region:'回声旧塔',subtitle:'回声可以留下，回答要由活着的人继续写。',palette:{ground:'#373d51',path:'#74738c',water:'#454a74',accent:'#c9cee9'},weather:'fog',decorSeed:156,intro:L('narrator','记忆塔原本用来保存人们的歌。多年无人维护，回声开始把倾听误认为挽留。'),outro:L('mother','爱不是让你留在最后一次见面的地方。你往前走，我也不算被忘记。'),nodes:[
N('tower_catalog','歌声不是灵魂','investigate','阅读母亲留下的采集记录。',L('suwan','这里写得很清楚：回声只会重现录下的片段，不能回答新的问题。','hero','可如果我听见她叫我，就还是会想靠近。','scribe','想念没有错。错的是用一座牢笼，保证没有人再离开。','narrator','沈宁在页边写：录音结束后，请记得关灯。还有人要回家。')),
N('tower_echoes','反复响起的名字','battle','打断把回声困住的影群。',L('hero','这些光总从我背后过来。','suwan','别追着每一道影子跑。先看真正蓄力的那一只。','narrator','战斗的间隙，塔里响起很多名字。它们值得被记得，却不该永远被呼喊。'),{enemies:['wisp','wisp','spitter','burrow'],waves:3,after:L('suwan','现在能听清别的声音了。风、脚步，还有你呼吸的声音。')}),
N('tower_mirrors','两个人画过的天空','puzzle','让星镜重新照向塔外。',L('suwan','小时候你说，海在东，家在西，最远的星在北。','hero','后来我只顾着向北，忘了回头和看旁边。','suwan','把方向都留下。人生不需要只允许一条路。'),{puzzle:{kind:'rotate',clue:'左镜照海向东，中镜望星向北，右镜照家向西。',labels:['北','东','南','西'],solution:[1,0,3]},after:L('narrator','星光第一次穿过塔窗，照向远处的村子。它没有要求任何人走回来。')}),
N('tower_lastvoice','要留下什么','talk','决定如何保存母亲的录音。',L('hero','我想一直听下去。好像只要不关掉，她就还没说完。','suwan','我们可以保存这段歌。也可以在想她的时候播放，而不是让整座塔替我们停在那一天。','mother','小舟，路走远了，可以慢慢回来。可别只剩回头这一件事。'),{choices:[choice('release','保存歌声，关掉不断重复的回路。','release_echo',2,1,'林舟按下停止。沉默里没有发生奇迹，但他的手不再颤抖。'),choice('keep','抄好乐谱，把录音交给共同的档案馆。','keep_memory',1,2,'母亲的歌不再属于一座孤独的塔。人们可以来听，也可以带着它走出去。')]}),
N('tower_engine','守护终止的权利','defend','保护正在关闭的回声机关。',L('scribe','每断开一层，回路就会试着重连。需要你们守住这里。','hero','我们不是来毁掉回忆。只是替它留一扇能打开的门。','suwan','机关会有三次亮光。每次都先守住人，再守住机器。'),{enemies:['shell','wisp','burrow'],waves:3,after:L('narrator','最后一声歌停在完整的句子后面。没有人急着把它重新放一遍。')}),
N('tower_gatekeeper','不肯放手的守门者','boss','击败守住塔顶的旧日回响。',L('narrator','守门者举起的不是刀，是无数重复的昨日。每一次挥落，都想把人推回原处。','hero','我会记得。但我不会只活在你留下的地方。','suwan','看着我。我们在这里，在现在。'),{enemies:['boss','shell','wisp'],waves:2,after:L('hero','山顶的灯还没亮。最后一段路，我想走完，再回家。')})
]});
CHAPTERS.push({id:7,title:'写给尚未到来的日子',region:'长明山脊',subtitle:'天亮以后，生活仍然需要一点点去过。',palette:{ground:'#485354',path:'#a4977e',water:'#5f7c87',accent:'#f0d8a6'},weather:'cold',decorSeed:181,intro:L('narrator','越接近山顶，风越像一封没有收件人的信。林舟终于不再要求它把每句话都带回过去。'),outro:L('narrator','有些遗憾没有消失。但从今往后，爱不必再等到来不及的时候，才被说出口。'),nodes:[
N('ridge_goodbyes','每个人带来的一点光','talk','整理同伴交给你的东西。',L('father','这把剑陪我走过很多夜路。现在交给你，不是要你替我完成什么。','brother','灯座我修好了。不能保证永远不坏，坏了我们再修。','suwan','我带了工坊的地址。等这一趟结束，我们就把下一次见面的日子写下来。','hero','好。我们都有明天要做的事。')),
N('ridge_wind','风口上的空隙','battle','穿过向山顶聚集的影兽。',L('suwan','风会盖住脚步。用地上的预警判断，别只听声音。','hero','先处理远处的，再对付有壳的。体力不够就撤一步。','narrator','林舟没有再一口气冲向最远的敌人。他开始给回来的路留出位置。'),{enemies:['spitter','shell','wolf','wisp'],waves:3,after:L('hero','以前我以为勇敢就是一直向前。原来停下来等人，也需要勇气。')}),
N('ridge_routes','归途并不只有一条','puzzle','根据三个人的记录选出安全的供灯路线。',L('brother','东面的旧索道断了，西边的石阶还牢。','father','灯油不能经过北边冻住的水槽。南边有避风的廊。','suwan','先走西阶，再进南廊，最后上灯室。我们把知道的拼起来，就够了。'),{puzzle:{kind:'sequence',clue:'避开断索道与冻水槽：西阶 → 南廊 → 灯室。',labels:['灯室','西阶','南廊'],solution:[1,2,0]},after:L('narrator','没有一个人掌握全部的路。四份记录叠在一起，刚好是一张完整的地图。')}),
N('ridge_lastnight','灯室前的最后一夜','defend','守住供灯装置，等待最后一道封印松开。',L('hero','这里没有什么再能带走我们必须守住的秘密了。','suwan','还有正在身边的人。','hero','那就守他们。','narrator','灯芯开始发亮。黑暗并没有立刻退去，只是终于有了边界。'),{enemies:['burrow','wisp','shell','spitter'],waves:3,after:L('suwan','天快亮了。你不用一个人看到最后，我也在。')}),
N('ridge_guardian','荒根的最后回声','boss','面对盘踞灯塔的荒根守卫。',L('narrator','荒根借来亲人的声音，问他愿不愿意留下。答案不需要仇恨，只需要一次清楚的告别。','hero','我爱他们。所以我要把他们教我的东西，带去还没有到来的日子。','suwan','它露出核心了。等重击落下，一起上。'),{enemies:['boss','wisp','shell'],waves:3,after:L('narrator','根须松开灯塔。光穿过叶片，没有带回任何人，却照见所有还在这里的人。')}),
N('ridge_tomorrow','把约定写到日历上','talk','点亮灯塔，选择接下来一起生活的方式。',L('father','你娘要是看见，准会说：灯修好了，回家吃饭。','hero','先吃早饭。然后，我们把答应彼此的事一件件做起来。','suwan','我的工坊下个月开课。你想怎样安排我们的日子？','brother','不用一次决定一辈子。先决定下一封信寄到哪里。'),{choices:[choice('home','修好老屋与书店，约定去海港相聚的日子。','future_home',1,1,'老屋窗边留了父亲的茶杯，门边放了苏晚的书箱。出门的人有远方，回来的人有钥匙。'),choice('sea','陪苏晚去海港，也定期回家一起吃饭。','future_sea',2,0,'行李里多了两只碗。给家里的信写着真实的烦恼和快乐，不再只剩一句我很好。')]})
]});
// CHAPTER_APPEND


const EPILOGUES=[
{flag:'future_home',text:'老屋成了书店与修灯铺。父亲的茶杯在窗边，苏晚来去海港时会把新修好的书带回来。家不再要求每个人永远待在同一间屋里。'},
{flag:'future_sea',text:'林舟与苏晚去了海港。寄回家的信有争执、有小小的得意，也有下一次回家的日期。父亲终于不必只从一句我很好里猜他们的生活。'},
{flag:'brother_home',text:'阿澄回家住了一段日子，又回海港造船。那张椅子不再是一处不能提起的伤口，谁想坐，都可以坐。'},
{flag:'brother_sea',text:'阿澄留在海港。他给父亲寄了一把合手的新刨子，林远回寄了试用的意见。他们终于有了悲伤以外的话题。'},
{flag:'suwan_independent',text:'苏晚按时进入修复工坊。她和林舟没有每天相见，却学会把需要、委屈与期待说得具体，而不是用沉默测量爱。'},
{flag:'suwan_together',text:'苏晚在工坊学习，林舟有自己的工作。两个人会在日落时交换各自一天的故事，彼此的世界没有因此缩成一间房。'},
{flag:'truth_public',text:'更正后的矿站记录由幸存者共同签名。父亲仍会难过，但不再把承担责任理解为永远惩罚自己。'},
{flag:'truth_witnesses',text:'见证人会议开了好几次，有争执，也有人中途离席。最后留下的记录并不整齐，却容得下不同的人说出自己的经历。'},
{flag:'share_burden',text:'村庄保留了风暴时的轮值表。房子仍会漏雨，但再没有人需要独自站到天亮。'},
{flag:'hold_line',text:'林舟留下了那件村民共同缝制的护具。它提醒他，站在前面的人，也可以被别人保护。'},
{flag:'release_echo',text:'音乐盒只在有人想听时打开。曲子结束以后，房间里会响起吃饭、争论和普通日子的声音。'},
{flag:'keep_memory',text:'母亲的乐谱被收入公共档案馆。孩子们有时把其中一小节唱错，父亲听见了，也只是笑一笑。'},
{flag:'side_father_taste',text:'父亲偶尔做一点带苦味的野菜，先问别人要不要，再给自己盛一碗。'},
{flag:'side_father_share',text:'老屋的菜单上写了每个人的名字。不同的口味依然会争论，但谁也不必从桌上消失。'},
{flag:'side_song_new',text:'孩子们把旧谱改成了适合合唱的调子。署名里保留沈宁，也写了所有后来接着唱的人。'},
{flag:'side_song_space',text:'那四拍留白没有被填满。每逢演奏，总有人在里面加入一段自己的旋律。'},
{flag:'side_boat_voyage',text:'阿澄的小船第一次独自驶离港口，父亲没有要求他报出每一个时辰，只说到岸后写封信。'},
{flag:'side_boat_visit',text:'约好的那个下午，两兄弟都到了。小船驶得很慢，没有谁催它一定要到达更远的地方。'},
{flag:'side_letter_sent',text:'那封字迹潦草的信被父亲放进抽屉最上层。重要的话，终于没有等到写得完美才寄出。'},
{flag:'side_letter_date',text:'父亲在日历上画了一个小圈。那一天还没到，可等待终于不再没有名字。'},
{text:'母亲没有回来。清晨的桌上，仍然有人把饭热好，也有人学会在饭还热着的时候说：我回来了。'}
];
function SQ(id,title,chapter,summary,nodes){const pos=SIDEQUESTS.filter(q=>q.chapter===chapter).length?[[390,580],[1100,1430],[1770,150]]:[[650,1380],[1050,550],[1800,1330]];nodes.forEach((n,i)=>{n.x=pos[i][0];n.y=pos[i][1];});SIDEQUESTS.push({id,title,chapter,summary,nodes});}
SQ('side_pantry','一张不再藏起来的菜单',0,'父亲把每个人的口味记在一张纸上，却忘了自己的。',[
N('pantry_ask','父亲不爱吃什么','talk','看看父亲的旧菜单。',L('hero','这里写了我不吃葱，阿澄喜欢甜，娘怕太咸。怎么没有你？','father','做惯了，没想过。以前我其实挺喜欢有一点苦的野菜。')),
N('pantry_patch','被占住的菜地','battle','帮父亲找回通往野菜地的小路。',L('father','不是要你替我种一辈子。先把这段路清出来，后面的我慢慢做。','hero','好。以后菜单上也要有你想吃的。'),{enemies:['wolf','burrow'],waves:1,after:L('narrator','野菜没有家里常吃的菜好看。父亲摘了一把，动作却比平时轻快。')}),
N('pantry_meal','把他的口味写上去','talk','一起决定今晚的菜单。',L('father','有一点苦。你可能吃不惯。','hero','我可以试着喜欢，也可以不喜欢。但这道菜不该因此从桌上消失。'),{choices:[choice('taste','一起尝尝父亲喜欢的野菜。','side_father_taste',0,1,'菜单多了一行林远的名字。他终于也成了需要被照顾的人。'),choice('share','多做一道，把各自喜欢的都放上桌。','side_father_share',1,0,'两道菜各占半张桌子。不同的口味，没有妨碍他们一起吃饭。')],reward:{xp:80,items:{stew:2,grain:3}}})
]);
SQ('side_post','给明年的自己',0,'一个孩子想写信，却不知道未来的住址。',[
N('post_child','没有地址的信','talk','帮闻叔收一封特殊的信。',L('scribe','小雨说要写给明年的自己，问地址该填哪里。','hero','也许先写今天最想记住的事，地址可以以后再找。')),
N('post_order','邮袋上的日期','puzzle','整理被雨打乱的三封信。',L('scribe','第一封是种子，第二封是花开，第三封是落叶。顺序错了，孩子会以为树先失去叶子才学会生长。','hero','也有冬天开始的故事。不过这一袋，我们先按季节整理。'),{puzzle:{kind:'sequence',clue:'春天播种，夏日开花，秋日落叶。',labels:['落叶','播种','开花'],solution:[1,2,0]}}),
N('post_return','把未来留给她自己','talk','把整理好的信交回闻叔。',L('scribe','你要在信里替她写一句将来会怎样吗？','hero','写今天有人认真收下了她的信就够了。未来让她自己回答。'),{reward:{xp:75,items:{seed:3,tea:1}},after:L('narrator','小雨在信封上画了一扇门。门没有关，里面也没有预先画好的人。')})
]);
SQ('side_bird','少一小节的歌',1,'母亲采集过的一支歌，需要新的演奏者。',[
N('bird_score','被虫蛀空的小节','investigate','读一份不完整的民歌谱。',L('scribe','谱子中间缺了四拍。补成最像原来的，应该就行。','hero','可谁知道原来一定只有一种唱法？')),
N('bird_echo','林间的节奏','puzzle','从留存的歌词找回节拍顺序。',L('mother','短雨两滴，长风一声，最后是脚步回家的节奏。','hero','不是必须一模一样。先找到这支歌想让人记住的路。'),{puzzle:{kind:'sequence',clue:'歌词顺序：雨滴 → 长风 → 脚步。',labels:['长风','脚步','雨滴'],solution:[2,0,1]}}),
N('bird_share','让别人接着唱','talk','决定如何补写缺失的乐谱。',L('scribe','这里可以记你的名字，也可以继续空着。','hero','写上修复者，不必冒充原作者。后来的人也能接着改。'),{choices:[choice('new','标明新编，让孩子们试唱。','side_song_new',1,0,'旧谱没有恢复成完整的过去，而是获得了继续被唱下去的机会。'),choice('space','保留空拍，让每位演奏者自己填。','side_song_space',0,1,'那段沉默成了歌的一部分。每个唱它的人，都能在里面放进自己的声音。')],reward:{xp:85,items:{herb:3,tea:1}}})
]);
SQ('side_forester','一个没做完的承诺',1,'闻叔曾答应亡友照看一棵树，却把它照顾得无法向外生长。',[
N('tree_ties','勒紧树干的布条','investigate','查看旧树上的纪念布。',L('scribe','我每年都来系一条，怕忘记。','hero','树干被勒住了。记得一个人，不能让还活着的东西也停下。')),
N('tree_nest','树根下的巢','battle','清理阻碍解开布条的影兽。',L('scribe','小心那边的幼枝。树根处总有东西突然钻出来。','hero','我会等它露头，再动手。'),{enemies:['burrow','shell'],waves:2,after:L('narrator','藏在树根下的影子散开，布条终于能一根根松下来。')}),
N('tree_release','还没结束的纪念','talk','和闻叔一起重新安放纪念布。',L('scribe','解下来以后，像是我把他丢了。','hero','我们可以把故事写在路牌上。来这里的人不必都背着你的重量。'),{reward:{xp:90,items:{wood:5,seed:2}},after:L('narrator','路牌只写了一件小事：他曾在雨里，替一个陌生人背过柴。')})
]);
SQ('side_shoes','一双总是太小的鞋',2,'苏晚一直保存童年的礼物，却不再适合穿它走远路。',[
N('shoes_memory','行囊底的旧鞋','talk','听苏晚讲一件小事。',L('suwan','这是我父亲做的。他去世后，我总觉得换掉它，就是嫌弃他。','hero','他给你做鞋，是想让你走得舒服，还是想让你永远走不远？')),
N('shoes_board','渡口的补鞋台','battle','取回被影兽围住的修鞋工具。',L('suwan','我想把旧鞋修好留在家里，再做一双合脚的。','hero','好。这次按你现在的脚来量。'),{enemies:['wolf','spitter'],waves:1,after:L('suwan','竟然多了这么多。原来我已经走到了过去的尺子量不到的地方。')}),
N('shoes_future','新鞋第一段路','talk','陪苏晚试走新鞋。',L('suwan','你不用说它像不像以前那双。','hero','我只问，走起来疼不疼。'),{reward:{xp:95,items:{roast:2,wood:2}},after:L('narrator','她把旧鞋装进干燥的布袋。新鞋上很快沾了泥，像一个真正开始的明天。')})
]);
SQ('side_tool','左手的锤子',3,'一位伤者不需要被赞美坚强，而需要合适的工具。',[
N('tool_measure','工具不是所有人都一样','investigate','检查矿站遗留的辅助握柄。',L('doctor','伤者回来时，大家都夸他坚强，却继续给他一把握不住的锤子。','hero','他需要的可能不是再多坚持一点，是有人把柄改短。')),
N('tool_recover','找回工坊图纸','battle','清理旧工坊的装载坑。',L('doctor','那堆矿壳兽移动慢，远处的吐雾兽会替它们封路。','hero','先拆掉远袭，再找厚壳的空隙。'),{enemies:['shell','shell','spitter'],waves:2,after:L('narrator','图纸上有许多不同大小的手印。每种尺寸都曾被认真量过。')}),
N('tool_deliver','先问好不好用','talk','把工具方案交给米娅。',L('hero','这把做完以后，不要说送给最勇敢的人。','doctor','我会问他，用着顺不顺手。不好用就再改。'),{reward:{xp:110,items:{ore:5,trap:2}},after:L('narrator','第一把试用失败了。他们没有责怪那只手，重新削了第二根木柄。')})
]);
SQ('side_names','碑上没有写的那一天',3,'一个家庭只想记住普通生活，而非被永远定义为事故家属。',[
N('names_request','一位家属的要求','talk','听闻叔转述纪念碑的新请求。',L('scribe','家属想把“英勇牺牲”换成“爱吃热面，怕冷，讲笑话不太好笑”。','hero','大家会同意吗？','scribe','大家总有意见。可那是他们记得的家人。')),
N('names_evidence','哪一种记录更真实','puzzle','从留言中辨认当事人的明确愿望。',L('scribe','家属亲笔写着：请保留他的日常，不替他编写最后一句话。','hero','那就按她写的做。名字后面不需要都接同一种故事。'),{puzzle:{kind:'deduce',clue:'家属明确要求保留日常，不虚构最后遗言。选择符合原话的铭文。',labels:['永远无所畏惧','爱吃热面，怕冷','虚构一句壮烈的遗言'],solution:[1]}}),
N('names_inscribe','名字后面的人','talk','完成新的纪念记录。',L('scribe','这几句话太普通了。','hero','普通到读完就能想象他坐在桌边。这样很好。'),{reward:{xp:100,items:{tea:2,ore:2}},after:L('narrator','有个人看见新铭文，笑了一下，随后哭了。他说，那人讲笑话确实不好笑。')})
]);
SQ('side_boat','一条不载遗憾的船',4,'林澄的小船不是逃离家人的工具，而是他自己的作品。',[
N('boat_plans','没有写完的船名','talk','听弟弟介绍他造的小船。',L('brother','我试过叫它归来，后来又涂掉了。每个人都觉得我只应该回家。','hero','它也可以叫出发。你先说想让它去哪里。')),
N('boat_launch','清出下水的斜坡','battle','保护木船的试航路线。',L('brother','斜坡底下的影兽会在靠近时突进，别背对水边。','hero','你指路，我来开路。这次听造船的人。'),{enemies:['wolf','burrow','spitter'],waves:2,after:L('narrator','船第一次碰到海水时，没有发生宏大的事。只是稳稳浮起来，像一个人终于站稳。')}),
N('boat_name','名字留给船主','talk','与林澄庆祝试航。',L('hero','想好名字了吗？','brother','叫普通日子。活下来以后，我最想要的其实就是这个。'),{choices:[choice('voyage','祝他驶向自己选择的地方。','side_boat_voyage',1,0,'林澄把小船登记在自己名下。家人留在紧急联系人的一栏，没有替他填写目的地。'),choice('visit','约好下一次一起出海的时间。','side_boat_visit',0,1,'他们没有约定永不分开，只约了下个月的一个下午。这一次，日历上真的有日期。')],reward:{xp:110,items:{wood:5,roast:2}}})
]);
SQ('side_book','书页之间的留白',4,'苏晚要修复的第一本书，原主人不希望每一道痕迹都被抹去。',[
N('book_margin','谁写在空白里','investigate','阅读受损书本的页边批注。',L('suwan','我本来想把污点都清掉。可是这里的墨迹，是一位母亲写给女儿的解释。','hero','书会更干净，但她读书时就听不到那个声音了。')),
N('book_pages','把折页放回故事里','puzzle','依据修复笔记排列三张书页。',L('suwan','第一页写遇见，第二页写误会，最后一页没有团圆，只写了理解。','hero','理解也可以是结尾。不是每一次分别都需要改成重逢。'),{puzzle:{kind:'sequence',clue:'故事的次序：遇见 → 误会 → 理解。',labels:['理解','遇见','误会'],solution:[1,2,0]}}),
N('book_return','修好，不等于抹平','talk','与苏晚完成修复记录。',L('suwan','我会写明哪里修过，哪里保留。修复者也应该承认自己的手来过。','hero','以后你的书店里，给我留一本这样的书。'),{reward:{xp:105,items:{tea:2,herb:4}},after:L('narrator','她在记录末尾签下苏晚两个字。那是一份工作，也是她开始拥有自己位置的证据。')})
]);
SQ('side_doctor','值夜表上的空格',5,'米娅需要的帮助，是有人允许医生也休息。',[
N('doctor_shift','一直写着同一个名字','investigate','看看避雨点的值夜安排。',L('hero','每一晚都是你。你打算什么时候睡？','doctor','等所有人都好起来。','hero','那可能永远等不到。你不需要先证明谁都不再需要你，才有权休息。')),
N('doctor_route','守住交班的路','defend','让志愿者安全接班。',L('doctor','我已经把需要注意的人写在纸上了。可总怕别人漏掉。','hero','教他们，允许他们问，也允许自己把灯交出去。'),{enemies:['wolf','wisp','spitter'],waves:2,after:L('narrator','第一位志愿者问了很多问题。米娅没有叹气，把答案一条条添到纸上。')}),
N('doctor_sleep','医生也在名单里','talk','替米娅安排一段真正的休息。',L('doctor','如果半夜有事，还是叫我。','hero','需要医生时叫你。有人找不到热水时，我们会先自己找。'),{reward:{xp:120,items:{stew:3,herb:5}},after:L('narrator','值夜表多了六个不同的名字。米娅睡着时，屋里的灯没有熄。')})
]);
SQ('side_archive','允许遗忘的小事',6,'闻叔记不清亡妻的声音，害怕这意味着爱正在消失。',[
N('archive_fear','忘了她怎样笑','talk','听闻叔说一个难以启齿的担心。',L('scribe','我记得她做过的事，却越来越想不起她的笑声。我是不是把她丢了一次又一次？','hero','也许爱不只住在记得多清楚里面。它也住在你后来怎样对待别人。')),
N('archive_silence','安静下来的房间','battle','关闭档案室外的回声噪点。',L('scribe','那些声音每一句都像她，连我没说过的话也替我回答。','hero','它们只是把旧片段接起来。你值得听见真实的沉默，也值得继续说新的话。'),{enemies:['wisp','wisp','burrow'],waves:2,after:L('narrator','房间终于安静。闻叔想了一会儿，忽然记起她不喜欢窗关得太严。')}),
N('archive_window','留一扇能透风的窗','talk','帮闻叔写下愿意分享的一段记忆。',L('scribe','我不写她最后说了什么。写她总嫌我煮面太软，可以吗？','hero','可以。也可以有一天，写你终于学会把面煮得刚好。'),{reward:{xp:130,items:{tea:3,ore:3}},after:L('narrator','他开了一点窗。风吹动纸角，没有带走纸上的字。')})
]);
SQ('side_letter','在来得及的时候',7,'最后一封信不寄给过去，而寄给仍能收到它的人。',[
N('letter_draft','没有收件人的道歉','investigate','整理旅途里写下但没寄出的信。',L('hero','我写过很多对不起。写完反而不敢寄，觉得还不够好。','suwan','也许收信的人等的不是一封完美的信，是你愿意开始说话。')),
N('letter_choose','该写给谁','puzzle','从手札里找出今天仍能行动的约定。',L('hero','让过去重来，我做不到。替所有人决定幸福，我也不该。','suwan','那就写你能做的：明天回来，坐下，把没说完的话接着说。'),{puzzle:{kind:'deduce',clue:'选择能由自己兑现、也尊重他人决定的约定。',labels:['让所有遗憾消失','替她决定未来','明天回来认真听她说'],solution:[2]}}),
N('letter_send','今天寄出的那一封','talk','把信交给下一班下山的人。',L('hero','爹，阿澄，今晚先别等我吃饭。山路还没走完，但我知道回家的方向。','hero','我想你们。等我回来，想听听这几天家里发生的小事。'),{choices:[choice('plain','照现在写的寄出去。','side_letter_sent',0,2,'信没有被再抄一遍。那些不够漂亮的字，终于先于犹豫走下山。'),choice('invite','加上苏晚和自己的下一次归期。','side_letter_date',2,0,'信末多了一行具体的日期。回家从一句安慰，变成可以共同等待的计划。')],reward:{xp:140,items:{stew:3,roast:3}}})
]);
// Keep optional scenes clear of the main path and harbor waterline.
for(const q of SIDEQUESTS)for(const n of q.nodes){const shift={bird_echo:[900,650],book_return:[1770,290],doctor_route:[850,580]}[n.id];if(shift){n.x=shift[0];n.y=shift[1];}}
// SIDE_APPEND


const mainPos=[[[440,1100],[800,850],[1350,1150],[1740,800],[1450,400],[1900,270]],[[480,1190],[520,850],[1040,550],[1490,840],[1870,1180],[1880,430]],[[510,1280],[980,1130],[1540,1300],[1830,880],[1460,510],[780,350]],[[430,1180],[850,1300],[1190,900],[1650,1150],[1800,650],[1450,280]],[[450,1170],[680,790],[1230,1180],[1740,880],[1420,450],[1960,300]],[[520,1230],[940,1100],[1690,1160],[1850,720],[1100,500],[1950,300]],[[550,1250],[1000,1100],[1700,1200],[1800,720],[1200,500],[1900,270]],[[470,1250],[930,920],[1510,1120],[1820,750],[1340,450],[1900,270]]];
CHAPTERS.forEach(c=>c.nodes.forEach((n,i)=>Object.assign(n,{x:mainPos[c.id][i][0],y:mainPos[c.id][i][1]})));
const count={};function tag(value,path){if(Array.isArray(value))value.forEach((v,i)=>tag(v,path+'_'+i));else if(value&&typeof value==='object'){if(typeof value.speaker==='string'&&typeof value.text==='string'){value.id='j_'+path;value.voice='assets/journey-voice/'+value.id+'.mp3';count[value.id]=true;}else for(const [k,v]of Object.entries(value))tag(v,path+'_'+k);}}
tag(CHAPTERS,'main');tag(SIDEQUESTS,'side');
const API={CHAPTERS,SIDEQUESTS,CAST,ITEMS,WEAPONS,RECIPES,BUILDINGS,EPILOGUES};if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.MosslightJourneyData=API;
})(typeof globalThis!=='undefined'?globalThis:this);
