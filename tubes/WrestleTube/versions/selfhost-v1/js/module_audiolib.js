/*!
**|  Audio File Library for CyTube Scripts
**|  Written by Xaekai
**|
**@preserve
*/

if (!this[CHANNEL.name].audioLibrary) {
    this[CHANNEL.name].audioLibrary = {};
}
this[CHANNEL.name].audioLibrary.sounds = {
    surprise:           { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/surprise.ogg',                                emote: false, squee: true  },
    dayum:              { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/dayum.ogg',                                   emote: false, squee: true  },
    airhorn:            { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/airhorn.mp3',                                 emote: true,  squee: true  },
    blop:               { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/blop.ogg',                                    emote: false, squee: true  },
    damnson:            { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/damnson.ogg',                                 emote: true,  squee: true  },
    dog1:               { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/dog1.ogg',                                    emote: true,  squee: true  },
    fairywand:          { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/fairy_wand.ogg',                              emote: false, squee: true  },
    hankhill:           { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/hankhill.ogg',                                emote: true,  squee: true  },
    hitmarker:          { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/hitmarker.mp3',                               emote: true,  squee: false },
    meatball:           { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/hobo_meatball.ogg',                           emote: true,  squee: true  },
    nigga:              { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/coming_for_you.ogg',                          emote: true,  squee: true  },
    present:            { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/present4ya.ogg',                              emote: true,  squee: true  },
    smokeweed:          { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/smokeweed.ogg',                               emote: true,  squee: true  },
    icq2003_incomingim: { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/ICQ2003_Message.wav',                         emote: false, squee: true  },
    icq2003_typing:     { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/ICQ2003_MsgType.wav',                         emote: false, squee: true  },
    icq2008_incomingim: { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/ICQ2008_IncomingIM.mp3',                      emote: false, squee: true  },
    icq2008_outgoingim: { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/ICQ2008_OutgoingIM.mp3',                      emote: false, squee: true  },
    icq2008_typing:     { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/ICQ2008_TypingIM.wav',                        emote: false, squee: true  },
    noscope:            { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/get_noscoped.mp3',                            emote: true,  squee: true  },
    wahaha:             { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/wahahaha.ogg',                                emote: true,  squee: true  },
    ut_mousehole:       { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/undertale_mousehole.ogg',                     emote: true,  squee: true  },
    uhoh:               { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/uhoh.ogg',                                    emote: true,  squee: true  },
    squish:             { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/squish.ogg',                                  emote: true,  squee: true  },
    squee:              { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/squee.ogg',                                   emote: true,  squee: true  },

    // loud or long
    mcguirk:            { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/mcguirk.ogg',                                 emote: true,  squee: true  },
    howcould:           { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/howcouldthishappen.ogg',                      emote: true,  squee: false },
    votingpoll:         { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/votingpoll.ogg',                              emote: true,  squee: true  },
    sandstorm:          { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/Darude_-_Sandstorm.ogg',                      emote: true,  squee: false },

    // 2025
    ceilingbird:        { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/racist.chirp.mp3',                            emote: false,  squee: false  },
    hurtingpeople:      { url: 'http://cdn.mruniver.se/hurtingpeople.ogg',                                        emote: false,  squee: false  },
    knock:              { url: 'http://cdn.mruniver.se/knock.ogg',                                                emote: false,  squee: false  },

    // Too many Pinkie Pies
    ut2004_firstblood:   { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/unreal/ut2004.first.blood.ogg',               emote: true, squee: false },
    ut2004_doublekill:   { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/unreal/ut2004.double.kill.ogg',               emote: true, squee: false },
    ut2004_multikill:    { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/unreal/ut2004.multikill.ogg',                 emote: true, squee: false },
    ut2004_megakill:     { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/unreal/ut2004.megakill.ogg',                  emote: true, squee: false },
    ut2004_killingspree: { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/unreal/ut2004.killing.spree.ogg',             emote: true, squee: false },
    ut2004_godlike:      { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/unreal/ut2004.godlike.ogg',                   emote: true, squee: false },
    ut2004_holyshit:     { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/unreal/ut2004.holy.shit.ogg',                 emote: true, squee: false },
    ut2004_ludicrous:    { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/unreal/ut2004.ludicrous.ogg',                 emote: true, squee: false },
    ut2004_monsterkill:  { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/unreal/ut2004.monster.kill.ogg',              emote: true, squee: false },
    ut2004_rampage:      { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/unreal/ut2004.rampage.ogg',                   emote: true, squee: false },
    ut2004_ultrakill:    { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/unreal/ut2004.ultrakill.ogg',                 emote: true, squee: false },
    ut2004_unstoppable:  { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/unreal/ut2004.unstoppable.ogg',               emote: true, squee: false },
    ut2004_wickedsick:   { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/unreal/ut2004.wicked.sick.ogg',               emote: true, squee: false },
    ut2004_dominating:   { url: 'https://cdn.jsdelivr.net/gh/buttocks/bakednetwork@wrestletube-selfhost-v1-20261115/wrestletube/versions/selfhost-v1/sounds/unreal/ut2004.dominating.ogg',                emote: true, squee: false },

};

this[CHANNEL.name].audioLibrary.squees = function () {
    var keys = Object.keys(this[CHANNEL.name].audioLibrary.sounds);
    var squees = {};
    for (var i = keys.length - 1; i >= 0; i--) {
        var soundObj = this[CHANNEL.name].audioLibrary.sounds[keys[i]];
        if (soundObj.squee) {
            squees[keys[i]] = soundObj.url;
        }
    }
    return squees;
}();
this[CHANNEL.name].audioLibrary.emotes = function () {
    var keys = Object.keys(this[CHANNEL.name].audioLibrary.sounds);
    var emotes = {};
    for (var i = keys.length - 1; i >= 0; i--) {
        var soundObj = this[CHANNEL.name].audioLibrary.sounds[keys[i]];
        if (soundObj.emote) {
            emotes[keys[i]] = new Audio(soundObj.url);
        }
    }
    return emotes;
}();