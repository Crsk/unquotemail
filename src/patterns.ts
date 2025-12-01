/**
 * Regex patterns for detecting email quote headers in various languages and formats
 *
 * @see https://github.com/crisp-oss/email-reply-parser/blob/master/lib/regex.js
 * @see https://github.com/mailgun/talon/blob/master/talon/quotations.py
 */

export const patterns: RegExp[] = [
  // English
  // On DATE, NAME <EMAIL> wrote:
  /^>*-*\s*((on|in a message dated)\s.+\s.+?(wrote|sent)\s*:)\s?-*/im,

  // French
  /^>*-*\s*((le)\s.+\s.+?(écrit)\s*:)\s?/im,

  // Spanish
  /^>*-*\s*((el)\s.+\s.+?(escribió)\s*:)\s?/im,

  // Italian
  /^>*-*\s*((il)\s.+\s.+?(scritto)\s*:)\s?/im,

  // Portuguese
  /^>*-*\s*((em)\s.+\s.+?(escreveu)\s*:)\s?/im,

  // German
  // Am DATE schrieb NAME <EMAIL>:
  /^\s*(am\s.+\s)schrieb.+\s?(\[|<).+(\]|>):/im,

  // Dutch
  // Il DATE, schreef NAME <EMAIL>:
  /^\s*(op\s[\s\S]+?(schreef|verzond|geschreven)[\s\S]+:)/im,

  // Polish
  // W dniu DATE, NAME <EMAIL> pisze|napisał:
  /^\s*((w\sdniu|dnia)\s[\s\S]+?(pisze|napisał(\(a\))?):)/im,

  // Swedish, Danish
  // Den DATE skrev NAME <EMAIL>:
  /^\s*(den|d.)?\s?.+\s?skrev\s?".+"\s*[\[|<].+[\]|>]\s?:/im,

  // Vietnamese
  // Vào DATE đã viết NAME <EMAIL>:
  /^\s*(vào\s.+\sđã viết\s.+:)/im,

  // Outlook 2019 (no)
  /^\s?.+\s*[\[|<].+[\]|>]\s?skrev følgende den\s?.+\s?:/m,

  // Outlook 2019 (cz)
  /^\s?dne\s?.+\,\s?.+\s*[\[|<].+[\]|>]\s?napsal\(a\)\s?:/im,

  // Outlook 2019 (ru)
  /^\s?.+\s?пользователь\s?".+"\s*[\[|<].+[\]|>]\s?написал\s?:/im,

  // Outlook 2019 (sk)
  /^\s?.+\s?používateľ\s?.+\s*\([\[|<].+[\]|>]\)\s?napísal\s?:/im,

  // Outlook 2019 (sv)
  /\s?Den\s?.+\s?skrev\s?".+"\s*[\[|<].+[\]|>]\s?følgende\s?:/m,

  // Outlook 2019 (tr)
  /^\s?".+"\s*[\[|<].+[\]|>]\,\s?.+\s?tarihinde şunu yazdı\s?:/im,

  // Outlook 2019 (hu)
  /^\s?.+\s?időpontban\s?.+\s*[\[|<|(].+[\]|>|)]\s?ezt írta\s?:/im,

  // ----------------------------

  // pe DATE NAME <EMAIL> kirjoitti:
  /^\s*(pe\s.+\s.+kirjoitti:)/im,

  // > 在 DATE, TIME, NAME 写道：
  /^(在[\s\S]+写道：)/m,

  // NAME <EMAIL> schrieb:
  /^(.+\s<.+>\sschrieb\s?:)/im,

  // NAME on DATE wrote:
  /^(.+\son.*at.*wrote:)/im,

  // "From: NAME <EMAIL>" OR "From : NAME <EMAIL>" OR "From : NAME<EMAIL>"
  /^\s*((from|van|de|von|da)\s?:.+\s?\n?\s*(\[|<).+(\]|>))/im,

  // ##########################
  // # Date starting patterns #
  // ##########################

  // DATE TIME NAME 작성:
  /^(20[0-9]{2}\..+\s작성:)$/m,

  // DATE TIME、NAME のメッセージ:
  /^(20[0-9]{2}\/.+のメッセージ:)/m,

  // 20YY-MM-DD HH:II GMT+01:00 NAME <EMAIL>:
  /^(20[0-9]{2})-([0-9]{2}).([0-9]{2}).([0-9]{2}):([0-9]{2})\n?(.*)>:/m,

  // DD.MM.20YY HH:II NAME <EMAIL>
  /^([0-9]{2}).([0-9]{2}).(20[0-9]{2})(.*)(([0-9]{2}).([0-9]{2}))(.*)"( *)<(.*)>( *):/m,

  // HH:II, DATE, NAME <EMAIL>:
  /^[0-9]{2}:[0-9]{2}(.*)[0-9]{4}(.*)"( *)<(.*)>( *):/m,

  // 02.04.2012 14:20 пользователь "bob@example.com" <bob@xxx.mailgun.org> написал:
  /(\d+\/\d+\/\d+|\d+\.\d+\.\d+).*\s\S+@\S+:/s,

  // 2014-10-17 11:28 GMT+03:00 Bob <bob@example.com>:
  /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\s+GMT.*\s\S+@\S+:/is,

  // Thu, 26 Jun 2014 14:00:51 +0400 Bob <bob@example.com>:
  /\S{3,10}, \d\d? \S{3,10} 20\d\d,? \d\d?:\d\d(:\d\d)?( \S+){3,6}@\S+:/,

  // martes, 8 de abril de 2025, 9:56:16 -0400, Alice Bob <alice.b@example.com>:
  /(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo),\s*\d{1,2}\s+de\s+[A-Za-záéíóúñ]+(?:\s+de)?\s+20\d{2},\s*\d{1,2}:\d{2}:\d{2}\s+[+-]\d{4},\s+.+\s<[^>]+>:\s*/is,

  // ############################
  // # Dash Delimiters patterns #
  // ############################

  // English
  // Original Message delimiter
  new RegExp(
    `^>?\\s*-{3,12}\\s*(${[
      'original message',
      'reply message',
      'original text',
      "message d'origine",
      'original email',
      'ursprüngliche nachricht',
      'original meddelelse',
      'original besked',
      'original message',
      'original meddelande',
      'originalbericht',
      'originalt meddelande',
      'originalt melding',
      'alkuperäinen viesti',
      'alkuperäinen viesti',
      'originalna poruka',
      'originalna správa',
      'originálna správa',
      'originální zpráva',
      'původní zpráva',
      'antwort nachricht',
      'oprindelig besked',
      'oprindelig meddelelse',
    ].join('|')})\\s*-{3,12}\\s*`,
    'im'
  ),
];
