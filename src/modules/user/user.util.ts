export function generateRandomNickname() {
  const adjectives = [
    '행복한',
    '슬기로운',
    '용감한',
    '빠른',
    '지혜로운',
    '사려깊은',
    '현명한',
    '차분한',
    '열정적인',
    '친절한',
  ];
  const nouns = [
    '고양이',
    '사자',
    '호랑이',
    '늑대',
    '여우',
    '독수리',
    '부엉이',
    '거북이',
    '토끼',
    '곰',
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective} ${randomNoun}`;
}
