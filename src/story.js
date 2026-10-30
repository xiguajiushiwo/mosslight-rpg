(function(root){
  'use strict';
  const CAST={
    narrator:{name:'林间来信',role:'旁白',color:'#d7d7b5'},
    hero:{name:'林舟',role:'归来的守灯人',color:'#d6dfaf'},
    father:{name:'林远',role:'父亲',color:'#d4bd8e'},
    mother:{name:'沈宁',role:'记忆里的母亲',color:'#e5c4a2'},
    suwan:{name:'苏晚',role:'提灯的旅人',color:'#e7bab2'}
  };
  const scene=(title,place,actors,lines,mood='dusk')=>({title,place,actors,mood,lines:lines.map((l,i)=>({speaker:l[0],text:l[1],x:l[2],y:l[3],pose:l[4]||'idle'}))});
  const SCENES={
    homecoming:scene('序章 · 灯还亮着','萤火村 · 秋暮',[{kind:'father',x:550,y:1240},{kind:'hero',x:600,y:1320,toX:575,toY:1270}], [
      ['narrator','离家的第三年，林舟收到父亲的信。只有一行：灯坏了，能回来一趟吗。',570,1250],
      ['hero','我以为，等我有了出息，再回来也不迟。',600,1290,'look'],
      ['father','饭还热着。先回家。',550,1240,'reach'],
      ['narrator','他没有问这些年过得好不好，只把门口那双旧拖鞋，往前推了推。',555,1240]
    ]),
    letter:scene('第一封信 · 没说完的晚安','旧屋门前',[{kind:'father',x:550,y:1240},{kind:'hero',x:590,y:1270}], [
      ['hero','娘的音乐盒呢？以前这个时候，她总在窗边放那支曲子。',590,1270],
      ['father','在西边的旧花园。她说，那里听得见你小时候的笑声。',550,1240],
      ['father','雨先落在窗上，风再穿过树林，最后……是灯。她教你的，你还记得吧。',550,1240],
      ['hero','我记得。只是很久没有好好听了。',590,1270]
    ]),
    music:scene('第一封信 · 风替她留下的话','母亲的花园',[{kind:'hero',x:430,y:515},{kind:'mother',x:468,y:475,ghost:true},{kind:'father',x:395,y:485,ghost:true}], [
      ['mother','小舟，饭凉了可以再热。路走远了，也可以慢慢回来。',460,490,'reach'],
      ['hero','娘，对不起。那年冬天，我应该早点回来。',430,515,'kneel'],
      ['mother','别把一辈子都用来补那一天。你要好好吃饭，好好爱人。',468,475],
      ['narrator','音乐盒的最后一格，藏着一枚褪色的纽扣。是她一直没舍得扔掉的，林舟的第一件外衣。',435,480]
    ],'memory'),
    reunion:scene('第二封信 · 两个人的路','风语溪南岸',[{kind:'hero',x:1510,y:1190},{kind:'suwan',x:1550,y:1160}], [
      ['suwan','你回来了。我本来想，放完这盏河灯，就去南边看看海。',1550,1160],
      ['hero','我以为你会一直在这里。',1510,1190],
      ['suwan','我喜欢你，林舟。但喜欢一个人，不该只剩下等。',1550,1160,'look'],
      ['hero','那这段路，让我陪你走。就从把灯送到桥下开始。',1510,1190,'reach']
    ]),
    river:scene('第二封信 · 把愿望送远一点','风语桥 · 河灯',[{kind:'hero',x:1100,y:927},{kind:'suwan',x:1145,y:927}], [
      ['suwan','灯里写的，是我想做的事。开一间小书店，冬天也卖热茶。',1145,927,'kneel'],
      ['hero','以前我总说，等以后。却没问过，你的以后是什么样。',1100,927],
      ['suwan','那现在开始问，也不算太晚。旧塔里还有我们画的星图，你愿意一起去吗？',1145,927,'reach'],
      ['hero','愿意。这一次，我把答案说在现在。',1100,927]
    ],'river'),
    stars:scene('第三封信 · 我们曾约好的天空','旧塔星台',[{kind:'hero',x:1385,y:400},{kind:'suwan',x:1435,y:390}], [
      ['suwan','小时候你说，走到最亮的那颗星下面，就能看见海。',1435,390],
      ['hero','后来我走了很远。见过许多灯，却没有一盏让我想停下来。',1385,400],
      ['suwan','你要找的，也许从来不是最亮的那一盏。',1435,390,'reach'],
      ['narrator','星图亮起时，林舟发现父亲这些年修补过每一面镜子。他沉默地，替两个孩子保管着远方。',1410,360]
    ],'stars'),
    father:scene('终章前夜 · 那封没有寄出的信','萤火村 · 归家',[{kind:'father',x:550,y:1240},{kind:'hero',x:580,y:1272},{kind:'suwan',x:625,y:1278}], [
      ['father','你娘走之前，托我写信叫你回来。我怕耽误你的前程，把信压在了抽屉里。',550,1240,'kneel'],
      ['hero','我一直以为，你怪我没有回来。',580,1272],
      ['father','我是在怪自己。修得好一村的灯，却不知道怎么跟自己的孩子说话。',550,1240],
      ['hero','爹，以后想我，就说想我。别再等灯坏了。',580,1272,'reach'],
      ['father','好。这把剑陪我走过很多夜路。最后那段路，你们一起走吧。',550,1240,'reach']
    ],'warm'),
    guardian:scene('最后的夜路 · 荒根守卫','月痕遗迹',[{kind:'hero',x:2005,y:600},{kind:'suwan',x:2045,y:615}], [
      ['narrator','没有说出口的思念，在遗迹里长成了盘结的树根。它守着旧日，也挡住了明天。',2005,415],
      ['suwan','我在这里。你不用再一个人撑着。',2045,615,'reach'],
      ['hero','我们不是来忘记谁的。我们是来带着他们，继续往前走。',2005,600]
    ],'storm'),
    ending:scene('尾声 · 写给明天的信','灯塔 · 破晓',[{kind:'hero',x:1985,y:285},{kind:'suwan',x:2030,y:290},{kind:'father',x:1940,y:320},{kind:'mother',x:2010,y:215,ghost:true}], [
      ['narrator','灯塔重新亮起。它没有让离开的人回来，却照见了仍然站在身边的人。',2010,235],
      ['father','你娘要是看见，准会说，灯修好了，该回家吃饭了。',1940,320],
      ['hero','明天，我们先陪您吃顿早饭。然后，我想和苏晚一起，把日子过成喜欢的样子。',1985,285,'reach'],
      ['suwan','等小书店开张，靠窗的位置，永远给您留着。',2030,290,'reach'],
      ['mother','小舟，天亮了。往前走吧。',2010,215],
      ['narrator','有些遗憾不会消失。但从今往后，爱不必再等到来不及的时候，才被说出口。',2010,235]
    ],'dawn')
  };
  for(const [id,s]of Object.entries(SCENES))s.lines.forEach((l,i)=>{l.id=id+'_'+i;l.voice='assets/voice/'+l.id+'.mp3';});
  const JOURNAL=[
    {id:'music',title:'母亲的纽扣',body:'她留下的不是一句责怪，而是“好好吃饭，好好爱人”。有些爱，不要求我们用余生偿还。'},
    {id:'escort',title:'苏晚的河灯',body:'她想看海，想开书店，也喜欢我。这些愿望从来不冲突。我终于学会先听她说。'},
    {id:'stars',title:'被修补的星图',body:'父亲没有阻止我们离开。他只是用一双越来越慢的手，替我们保管着远方。'}
  ];
  const API={CAST,SCENES,JOURNAL};if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.MosslightStory=API;
})(globalThis);
