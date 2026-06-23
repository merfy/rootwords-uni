import json, re

with open(r'C:\Users\minfe\Documents\Codex\rootwords-uni\src\utils\data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Convert JS to Python-safe
py_content = content.replace('// Auto-generated data file', '# Auto-generated data file')
py_content = py_content.replace('const DATA = ', 'DATA = ')
py_content = py_content.replace('export default DATA;', '')
exec(py_content)

PREFIX_MEANINGS = {
    "a-": "不，无；在…上", "ab-": "离开，偏离", "abs-": "离开，偏离",
    "ad-": "向，朝，接近", "aero-": "空气，航空", "ambi-": "两，双方",
    "an-": "不，无", "andro-": "男，雄", "anthropo-": "人，人类",
    "anti-": "反，对抗", "as-": "向，朝（ad-变体）",
    "bi-": "二，双", "co-": "共同，一起", "com-": "共同，一起",
    "con-": "共同，一起", "cor-": "共同，一起（con-变体）",
    "de-": "向下；离开；加强", "di-": "二，双；分开",
    "dis-": "分开，否定", "du-": "二，双", "e-": "出，向外",
    "ef-": "出，向外（ex-变体）", "equi-": "相等", "eso-": "向内",
    "ex-": "向外，出", "extra-": "超出，额外",
    "helic-": "螺旋", "helico-": "螺旋", "hipp-": "马",
    "il-": "不，无（in-变体）", "im-": "向内；不，无",
    "in-": "向内；不，无", "inter-": "在…之间，相互",
    "intra-": "在…内部", "matri-": "母亲，母性",
    "metro-": "母亲，母性", "miso-": "厌恶，恨",
    "mono-": "单一，一个", "multi-": "多",
    "ob-": "反对，朝向", "palin-": "回，向后",
    "pen-": "几乎，接近", "per-": "贯穿，彻底",
    "phago-": "吃，吞噬", "philo-": "爱，喜好",
    "poly-": "多", "pre-": "前，预先",
    "privi-": "私人的，个人", "pro-": "向前，赞成",
    "re-": "再，又；向后", "sarco-": "肉",
    "sub-": "在…下，次一等", "suc-": "在…下（sub-变体）",
    "sum-": "在…下（sub-变体）", "super-": "超，在上",
    "syn-": "共同，一起", "un-": "不，非（否定）",
}

SUFFIX_MEANINGS = {
    "-a": "名词后缀", "-able": "能…的，可…的", "-ade": "动作或产物",
    "-age": "行为/状态/总称", "-al": "…的，与…有关的",
    "-ance": "状态/性质/动作", "-and": "应被…的人/物",
    "-aneous": "具有…性质的", "-ant": "…的；做…的人",
    "-any": "与…相关的", "-ar": "与…有关的，…的",
    "-archy": "统治，政体", "-ary": "与…有关的；场所",
    "-ate": "动词后缀（使…）；…的", "-ated": "已…的，被…的",
    "-ation": "行为/状态/结果", "-ator": "做…的人/物",
    "-cyte": "细胞", "-e": "动词/名词后缀",
    "-ed": "已…的，被…的", "-ella": "小（后缀）",
    "-ence": "状态/性质/行为", "-ensil": "工具，器具",
    "-ent": "…的；做…的人/物", "-er": "做…的人/物",
    "-escence": "开始…的过程", "-escent": "开始…的，渐…的",
    "-ful": "充满…的", "-fy": "使…，…化",
    "-graph": "写/画/记录", "-ial": "…的，与…有关的",
    "-ible": "能…的，可…的", "-ic": "…的，与…相关的",
    "-icle": "小（指小后缀）", "-id": "…的，具有…性质的",
    "-ier": "与…有关的人/物", "-ify": "使…，…化",
    "-il": "易于…的，能…的", "-ile": "能…的，易于…的；指小",
    "-ine": "…的；化学名词", "-ing": "行为/状态/结果",
    "-ion": "行为/状态/结果", "-ior": "比较级后缀",
    "-ish": "稍…的；动词后缀", "-ism": "主义，学说，行为",
    "-ist": "…主义者；…家", "-ite": "…的；…人/物",
    "-ition": "行为/状态/结果", "-itor": "做…的人",
    "-itosis": "疾病/异常状态", "-ity": "性质/状态",
    "-ive": "有…性质的，…的", "-ize": "使…，…化",
    "-logist": "…学家", "-logy": "…学，…论",
    "-ly": "副词后缀（…地）", "-mania": "狂热，癖好",
    "-ment": "行为/结果/状态", "-mony": "状态/结果/物品",
    "-more": "更多，更", "-ness": "性质/状态", "-o": "名词后缀",
    "-oid": "似…的，…状的", "-ol": "酒精/化学物质",
    "-on": "名词后缀", "-or": "做…的人/物",
    "-ous": "充满…的，…的", "-phile": "爱好…的人",
    "-rant": "…的人/物", "-ry": "行为/状态/总称",
    "-taneous": "具有…性质的", "-tic": "…的，与…相关的",
    "-tle": "反复/小称后缀", "-ture": "行为/结果/状态",
    "-ue": "名词/动词后缀", "-ule": "小（指小后缀）",
    "-ulent": "充满…的", "-um": "名词后缀",
    "-uous": "充满…的，…的", "-ure": "行为/结果/状态",
    "-urne": "器具/容器", "-us": "名词后缀",
    "-y": "形容词/名词后缀",
}


def get_affixes(words):
    prefixes = set()
    suffixes = set()
    for w in words:
        for m in w[2]:
            if m.endswith("-") and not m.startswith("-"):
                prefixes.add(m)
            elif m.startswith("-") and not m.endswith("-"):
                suffixes.add(m)
    aff = []
    for p in sorted(prefixes):
        aff.append(["prefix", p, PREFIX_MEANINGS.get(p, "")])
    for s in sorted(suffixes):
        aff.append(["suffix", s, SUFFIX_MEANINGS.get(s, "")])
    return aff


# Check entries without affixes
no_affix = []
for i, d in enumerate(DATA):
    if "affixes" not in d:
        no_affix.append(i)

print(f"{len(no_affix)} entries without affixes out of {len(DATA)} total")
