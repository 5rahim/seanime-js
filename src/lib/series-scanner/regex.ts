export const ANIDB_RX = [
// 0
    /(^|(?<show>.*?)[ _\.\-(]+)(SP|OAV|OVA|OAD|ONA) ?(?<ep>\d{1,2})(-(?<ep2>[0-9]{1,3}))? ?(?<title>.*)$/i,                                                //   #  5 # 001-099 Specials
// 1
    /(^|(?<show>.*?)[ _\.\-(]+)(OP|NCOP) ?(?<ep>\d{1,2}[a-z]?)? ?([ _\.\-)]+(?<title>.*))?$/i,                                     //   #  6 # 100-149 Openings
// 2
    /(^|(?<show>.*?)[ _\.\-(]+)(ED|NCED) ?(?<ep>\d{1,2}[a-z]?)? ?([ _\.\-)]+(?<title>.*))?$/i,                                      //   #  7 # 150-199 Endings
// 3
    /(^|(?<show>.*?)[ _\.\-(]+)(TRAILER|PROMO|PV|T) ?(?<ep>\d{1,2}) ?([ _\.\-)]+(?<title>.*))?$/i,                                         //   #  8 # 200-299 Trailer, Promo with a  number  '(^|(?<show>.*?)[ _\.\-]+)((?<=E)P|PARODY|PARODIES?) ?(?<ep>\d{1,2})? ?(v2|v3|v4|v5)?(?<title>.*)$',                                                                        # 10 # 300-399 Parodies
// 4
    /(^|(?<show>.*?)[ _\.\-(]+)(O|OTHERS?)(?<ep>\d{1,2}) ?[ _\.\-)]+(?<title>.*)$/i,                                                       //   #  9 # 400-499 Others
// 5
    /[-._ ](S|SP)(?<season>(0|00))(?=[Ee]\d)/i,
// 6
    /[-._( ](OVA|ONA)[-._) ]/,
// 7
    /(^|(?<show>.*?)[ _\.\-(]+)(e|ep|e |ep |e-|ep-)?(?<ep>[0-9]{1,3})((e|ep|-e|-ep|-)(?<ep2>[0-9]{1,3})|)? ?(v2|v3|v4|v5)?([ _\.\-]+(?<title>.*))?$/, //   # 10 # E01 | E01-02| E01-E02 | E01E02                                                                                                                       # __ # look behind: (?<=S) < position < look forward: (?!S)
// 8
    /(^|(?<show>.*?)[ _\.\-(]+)S ?(?<ep>\d{1,2}) ?(?<title>.*)$/i,
]

export const SERIES_RX = [                                                                                                                                                  //         ######### Series regex - "serie - xxx - title" ###
    /(^|(?<show>.*?)[ _\.\-]+)(?<season>[0-9]{1,2})[Xx](?<ep>[0-9]{1,3})((|[_\-][0-9]{1,2})[Xx](?<ep2>[0-9]{1,3}))?([ _\.\-]+(?<title>.*))?$/i,                       //#  0 # 1x01
    /(^|(?<show>.*?)[ _\.\-]+)s(?<season>[0-9]{1,2})(e| e|ep| ep|-)(?<ep>[0-9]{1,3})(([ _\.\-]|(e|ep)|[ _\.\-](e|ep))(?<ep2>[0-9]{1,3}))?($|( | - |)(?<title>.*?)$)/i,//#  1 # s01e01-02
    /(^|(?<show>.*?)[ _\.\-]+)(?<ep>[0-9]{1,3})[ _\.\-]?of[ _\.\-]?[0-9]{1,3}([ _\.\-]+(?<title>.*?))?$/i,                                                              //#  2 # 01 of 08 (no stacking for this one ?)
    /^(?<show>.*?) - (E|e|Ep|ep|EP)?(?<ep>[0-9]{1,3})(-(?<ep2>[0-9]{1,3}))?( - )?(?<title>.*)$/i,                                                                      //#  3 # Serie - xx - title.ext | ep01-ep02 | e01-02
    /^(?<show>.*?) \[(?<season>[0-9]{1,2})\] \[(?<ep>[0-9]{1,3})\] (?<title>.*)$/i,
]

export const SPECIALIZED_RX = {
    SPECIAL: [
        /(^|(?<show>.*?)[ _\.\-(]+)(SP|OAV|OVA|OAD|ONA) ?(?<ep>\d{1,2})(-(?<ep2>[0-9]{1,3}))? ?(?<title>.*)$/i,
        /[-._( ](OVA|ONA)[-._) ]/,
        /[-._ ](S|SP)(?<season>(0|00))(?=[Ee]\d)/i,
    ],
    NC: [
        /(^|(?<show>.*?)[ _\.\-(]+)(OP|NCOP) ?(?<ep>\d{1,2}[a-z]?)? ?([ _\.\-)]+(?<title>.*))?$/i,
        /(^|(?<show>.*?)[ _\.\-(]+)(ED|NCED) ?(?<ep>\d{1,2}[a-z]?)? ?([ _\.\-)]+(?<title>.*))?$/i,
        /(^|(?<show>.*?)[ _\.\-(]+)(TRAILER|PROMO|PV|T) ?(?<ep>\d{1,2}) ?([ _\.\-)]+(?<title>.*))?$/i,
        /(^|(?<show>.*?)[ _\.\-(]+)(O|OTHERS?)(?<ep>\d{1,2}) ?[ _\.\-)]+(?<title>.*)$/i,
    ],
}
