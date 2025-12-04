'use strict';

const DEFAULT_DATA = {
    // 时光故事
    storyItems: [
        {
            id: 'story_1',
            date: '2025.10.11',
            content: '我们在青藤相识。',
            timestamp: Date.now() - 86400000 * 100
        },
        {
            id: 'story_2',
            date: '2025.10.20',
            content: '我们添加了微信，开始产生现实的交集。',
            timestamp: Date.now() - 86400000 * 80
        },
        {
            id: 'story_3',
            date: '2025.11.01',
            content: '我们第一次约会，相处得非常融洽，为了变得更好我决定去改变造型。',
            timestamp: Date.now() - 86400000 * 60
        },
        {
            id: 'story_4',
            date: '2025.11.09',
            content: '我们第二次约会，带着新造型前去并得到了夸奖，我因自己在慢慢变得更好而感到开心。',
            timestamp: Date.now() - 86400000 * 40
        },
        {
            id: 'story_5',
            date: '2025.11.10',
            content: '你告诉我睡不好是我的原因，我感到很惶恐，好在短暂的讨论后我们仍然决定再向前走看看。',
            timestamp: Date.now()
        },
        {
            id: 'story_6',
            date: '2025.11.23',
            content: '我们第三次约会，在聊天中我真正有了你想要理解我的感觉，因此我也下定了决心。',
            timestamp: Date.now()
        },
        {
            id: 'story_7',
            date: '2025.11.24',
            content: '聊天中的“我也好想让你一直纯开心”击中了我的心，那一刻我觉得自己什么都做得到。',
            timestamp: Date.now()
        },
        {
            id: 'story_7',
            date: '2025.11.29',
            content: '我们第四次约会，拜访女孩子家和观看互动剧场都是我的初体验，我怀着激动的心情不断畅想未来。',
            timestamp: Date.now()
        },
        {
            id: 'story_8',
            date: '直到现在',
            content: '未完待续，我希望能永远未完待续……',
            timestamp: Date.now()
        },
    ],

    // 珍贵回忆
    memoryItems: [
        {
            id: 'memory_1',
            caption: '第一次一起做手工',
            date: '2025.11.23',
            icon: '',
            imageUrl: '',
            timestamp: Date.now() - 86400000 * 100
        },
        {
            id: 'memory_2',
            caption: '第一次一起去看剧场',
            date: '2025.11.29',
            icon: '',
            imageUrl: '',
            timestamp: Date.now() - 86400000 * 80
        },
        {
            id: 'memory_3',
            caption: '第一次——',
            date: '20--.--.--',
            icon: '',
            imageUrl: '',
            timestamp: Date.now() - 86400000 * 60
        },
        {
            id: 'memory_4',
            caption: '第一次——',
            date: '20--.--.--',
            icon: '',
            imageUrl: '',
            timestamp: Date.now() - 86400000 * 40
        },
        {
            id: 'memory_5',
            caption: '第一次——',
            date: '20--.--.--',
            icon: '',
            imageUrl: '',
            timestamp: Date.now() - 86400000 * 40
        },
        {
            id: 'memory_6',
            caption: '第一次——',
            date: '20--.--.--',
            icon: '',
            imageUrl: '',
            timestamp: Date.now() - 86400000 * 40
        },
    ],

    // 心路历程
    journeyText: `我其实还有好多事想要做——
我想定制两条项链
正面刻上我们的名字缩写，反面刻上二维码入口
我想这个网页最终一定会因为更新了太多东西而卡顿，
买了一个云空间，还思考了很多很多对策
但终究，还没等实现就要拿出来了……

坐在楼下长椅上发呆的时候
坐在剧场里欢笑的时候
坐在家里沙发上聊天的时候
我无数次想牵你的手又忍住了
写到一半的时候
我竟然想着“要是当时牵一下就好了”
我不想思考这种事
我依然期待着，也相信着，我们是会有未来的

我无意用完全是我自发的努力来感动你
也未曾想过卖惨来博取你的同情
更不希望让这一切变成你的压力与负担
但我真的慌了，所以我最终还是做了类似的事
抱歉，但依然请你相信我
我只是希望在你做决定之前
让你触摸一下我的心脏
看啊
即使在寒风中
它好像也在微微发烫`,

    // 纪念日列表
    anniversaryItems: [
        {
            id: 'anniversary_meet',
            name: '我们相识',
            date: '2025-10-11',
            icon: 'meet',
            isDefault: true,
            priority: 1
        },
        {
            id: 'anniversary_together',
            name: '我们在一起',
            date: '',
            icon: 'heart',
            isDefault: true,
            priority: 0
        }
    ]
};

// 工具函数
function generateId(prefix = 'item') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function getCurrentDateString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
}

function getDefaultDataCopy() {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

// 导出到全局
window.DEFAULT_DATA = DEFAULT_DATA;
window.generateId = generateId;
window.getCurrentDateString = getCurrentDateString;
window.getDefaultDataCopy = getDefaultDataCopy;