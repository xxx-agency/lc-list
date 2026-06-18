#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'generated');
const CACHE_PATH = path.join(ROOT, 'question-cache.json');
const GRAPHQL_URL = 'https://leetcode.cn/graphql/';

function parseArgs(argv) {
  const options = {
    text: '',
    textFile: '',
    name: '',
    private: false,
    offline: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--text-file') {
      options.textFile = argv[++i] || '';
    } else if (arg === '--name') {
      options.name = argv[++i] || '';
    } else if (arg === '--private') {
      options.private = true;
    } else if (arg === '--offline') {
      options.offline = true;
    } else {
      options.text += `${options.text ? ' ' : ''}${arg}`;
    }
  }

  if (options.textFile) {
    options.text = fs.readFileSync(path.resolve(options.textFile), 'utf8');
  }

  options.text = options.text.trim();
  if (!options.text) {
    throw new Error('Pass task text, for example: node lc-list/create-list.js "Day 23 linked-list 206 ..."');
  }

  return options;
}

function toHalfWidth(text) {
  return text.replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
}

function normalizeText(text) {
  return toHalfWidth(text)
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripComplexities(text) {
  return text.replace(/\bO\s*[\(\uff08][^\)\uff09]*[\)\uff09]/gi, ' ');
}

function parseTask(text, nameOverride) {
  const normalized = normalizeText(text);
  const dayMatch = normalized.match(/day\s*(\d+)/i);
  const day = dayMatch ? Number(dayMatch[1]) : null;
  const afterDay = dayMatch ? normalized.slice(dayMatch.index + dayMatch[0].length) : normalized;
  const firstIdMatch = afterDay.match(/\d{1,5}/);
  const listName = (nameOverride || (
    firstIdMatch ? afterDay.slice(0, firstIdMatch.index) : 'LeetCode list'
  )).trim() || 'LeetCode list';
  const problemText = firstIdMatch ? afterDay.slice(firstIdMatch.index) : afterDay;

  const ids = stripComplexities(problemText)
    .split(/[\u3001,;|]+/)
    .flatMap((part) => {
      const trimmed = part.trim();
      const idsInPart = [];
      const firstMatch = trimmed.match(/^(\d{1,5})\b/);
      if (firstMatch) {
        idsInPart.push(firstMatch[1]);
      }

      const tail = firstMatch ? trimmed.slice(firstMatch[0].length) : trimmed;
      const trailingMatch = tail.match(/[A-Za-z\u4e00-\u9fff]+(\d{1,5})$/);
      if (trailingMatch) {
        idsInPart.push(trailingMatch[1]);
      }

      return idsInPart.map((id) => id.replace(/^0+/, '') || '0');
    })
    .filter(Boolean)
    .filter((id, index, all) => all.indexOf(id) === index);

  if (!ids.length) {
    throw new Error('No LeetCode problem ids were parsed from the task text.');
  }

  return {
    sourceText: normalized,
    day,
    listName,
    description: day ? `Day ${day} ${listName}` : listName,
    ids,
  };
}

function loadCache() {
  if (!fs.existsSync(CACHE_PATH)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
}

async function gql(query, variables) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (body.errors) {
    throw new Error(JSON.stringify(body.errors));
  }
  return body.data;
}

async function fetchQuestion(id) {
  const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
        questions {
          frontendQuestionId
          titleSlug
          title
          titleCn
        }
      }
    }
  `;
  const data = await gql(query, {
    categorySlug: '',
    skip: 0,
    limit: 50,
    filters: { searchKeywords: id },
  });
  const questions = data.problemsetQuestionList?.questions || [];
  const exact = questions.find((question) => String(question.frontendQuestionId) === String(id));
  if (!exact) {
    throw new Error(`No LeetCode CN question found for id ${id}.`);
  }
  return {
    id,
    titleSlug: exact.titleSlug,
    title: exact.titleCn || exact.title,
  };
}

async function resolveQuestions(ids, options) {
  const cache = loadCache();
  const questions = [];
  let cacheChanged = false;

  for (const id of ids) {
    if (cache[id]) {
      questions.push({ id, ...cache[id] });
      continue;
    }

    if (options.offline) {
      throw new Error(`Missing LeetCode ${id} in local cache. Run without --offline once.`);
    }

    const question = await fetchQuestion(id);
    cache[id] = {
      titleSlug: question.titleSlug,
      title: question.title,
    };
    cacheChanged = true;
    questions.push(question);
  }

  if (cacheChanged) {
    saveCache(cache);
  }
  return questions;
}

function buildBookmarklet(task, isPublicFavorite) {
  const payload = {
    listName: task.listName,
    description: task.description,
    isPublicFavorite,
    questionSlugs: task.questions.map((question) => question.titleSlug),
  };

  return `(async()=>{const payload=${JSON.stringify(payload)};function csrf(){return document.cookie.split('; ').find(x=>x.startsWith('csrftoken='))?.split('=')[1]||''}async function gql(query,variables){const res=await fetch('/graphql/',{method:'POST',credentials:'include',headers:{'content-type':'application/json','x-csrftoken':csrf(),referer:location.href},body:JSON.stringify({query,variables})});const body=await res.json();if(body.errors)throw new Error(JSON.stringify(body.errors));return body.data}async function addAll(favoriteSlug){const batch='mutation batchAddQuestionsToFavorite($favoriteSlug: String!, $questionSlugs: [String]!) { batchAddQuestionsToFavorite(favoriteSlug: $favoriteSlug, questionSlugs: $questionSlugs) { ok error } }';let data=await gql(batch,{favoriteSlug,questionSlugs:payload.questionSlugs});let result=data.batchAddQuestionsToFavorite;if(result?.ok)return{added:payload.questionSlugs.length,skipped:0,failed:[]};const single='mutation addQuestionToFavoriteV2($favoriteSlug: String!, $questionSlug: String!) { addQuestionToFavoriteV2(favoriteSlug: $favoriteSlug, questionSlug: $questionSlug) { ok error } }';const added=[];const skipped=[];const failed=[];for(const questionSlug of payload.questionSlugs){try{data=await gql(single,{favoriteSlug,questionSlug});result=data.addQuestionToFavoriteV2;if(result?.ok)added.push(questionSlug);else{const error=result?.error||'unknown error';if(/exist|already|重复|已存在/i.test(error))skipped.push(questionSlug);else failed.push(questionSlug+': '+error)}}catch(e){failed.push(questionSlug+': '+e.message)}}return{added:added.length,skipped:skipped.length,failed}}try{if(!location.hostname.endsWith('leetcode.cn'))throw new Error('当前页面不是 leetcode.cn，请先打开力扣页面。');const create='mutation createEmptyFavorite($description: String, $favoriteType: FavoriteTypeEnum!, $isPublicFavorite: Boolean = true, $name: String!) { createEmptyFavorite(description: $description, favoriteType: $favoriteType, isPublicFavorite: $isPublicFavorite, name: $name) { ok error favoriteSlug } }';const created=await gql(create,{name:payload.listName,description:payload.description,favoriteType:'NORMAL',isPublicFavorite:payload.isPublicFavorite});const favorite=created.createEmptyFavorite;if(!favorite?.ok||!favorite.favoriteSlug)throw new Error(favorite?.error||'创建题单失败');const result=await addAll(favorite.favoriteSlug);if(result.failed.length){alert('题单 '+payload.listName+' 已创建，但有失败项。新增 '+result.added+'，已存在/跳过 '+result.skipped+'，失败 '+result.failed.length+'：\\n'+result.failed.join('\\n'))}else{alert('已完成：'+payload.listName+'，共 '+payload.questionSlugs.length+' 题。')}location.href='/problem-list/'+favorite.favoriteSlug+'/'}catch(e){alert('创建/加入题单失败：'+e.message)}})()`;
}

function writeOutputs(task, bookmarklet) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const taskPath = path.join(OUT_DIR, 'current-task.json');
  const bookmarkletPath = path.join(OUT_DIR, 'current-bookmarklet.js');
  const summaryPath = path.join(OUT_DIR, 'current-summary.md');

  fs.writeFileSync(taskPath, `${JSON.stringify(task, null, 2)}\n`, 'utf8');
  fs.writeFileSync(bookmarkletPath, `${bookmarklet}\n`, 'utf8');
  fs.writeFileSync(summaryPath, [
    `# ${task.listName}`,
    '',
    `描述：${task.description}`,
    '',
    '| 序号 | LeetCode | 题目 | titleSlug |',
    '|---:|---:|---|---|',
    ...task.questions.map((question, index) => `| ${index + 1} | ${question.id} | ${question.title} | ${question.titleSlug} |`),
    '',
  ].join('\n'), 'utf8');

  return { taskPath, bookmarkletPath, summaryPath };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const task = parseTask(options.text, options.name);
  task.questions = await resolveQuestions(task.ids, options);

  const bookmarklet = buildBookmarklet(task, !options.private);
  const paths = writeOutputs(task, bookmarklet);
  console.log(`List name: ${task.listName}`);
  console.log(`Question count: ${task.questions.length}`);
  console.log(`Generated: ${paths.bookmarkletPath}`);
  console.log('Next: run lc-list\\inject-to-chrome.ps1 or paste generated\\current-bookmarklet.js into the address bar on leetcode.cn.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
