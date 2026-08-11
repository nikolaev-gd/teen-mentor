# -*- coding: utf-8 -*-
"""Чем зеркало nikolaev-mentor.site отличается от основного сайта nikolaev-mentor.ru.

Раскладка зеркала:

    nikolaev-mentor.site/        английская главная — файл _mirror/index.en.html
    nikolaev-mentor.site/ru/     русская главная, цены пересчитаны в евро
    nikolaev-mentor.site/products/ ...  всё остальное повторяет основной сайт

На самом nikolaev-mentor.ru английской страницы нет: она лежит в папке
_mirror, а GitHub Pages прогоняет сайт через Jekyll, который не публикует
ничего, что начинается с «_».

Курс, по которому пересчитаны суммы: 100 000 ₽ = 1250 €, то есть 80 ₽ за евро.
Доллар считаем как 1,1 к евро. Суммы округлены до круглых.

Кто это запускает: ~/Dev/tools/sync-mirror-site.sh при каждом git push.
Скрипт берёт файлы из ветки main, применяет замены и кладёт результат
в дерево зеркала. Рабочая копия и сам сайт .ru не трогаются.

Если строка из левой колонки не найдена в файле ровно один раз — сборка
падает с ошибкой и push не проходит. Так правка текста про деньги на .ru
не разъедется с зеркалом молча: сначала поправь замену здесь.
"""

import subprocess
import sys
from pathlib import Path

HL = '<span style="color:#8FC7A8;font-weight:600">'

# Русская главная на .site уезжает на /ru/, поэтому все относительные ссылки
# в ней нужно поднять на уровень выше. Редактор ?edit отсюда убираем: он
# сохраняет файл по его имени без папки и записал бы правку из /ru/
# в корневой index.html основного репозитория.
RU_REPLACEMENTS = [
    ('href="favicon-32x32.png"',   'href="../favicon-32x32.png"'),
    ('href="favicon-16x16.png"',   'href="../favicon-16x16.png"'),
    ('href="apple-touch-icon.png"', 'href="../apple-touch-icon.png"'),
    ('src="portrait-1.jpeg"',      'src="../portrait-1.jpeg"'),
    ('src="portrait-2.jpeg"',      'src="../portrait-2.jpeg"'),
    ('href="products/"',           'href="../products/"'),
    ('<script src="editor.js"></script>', ''),
    # Валюта в блоке «Деньги»: на .ru рубли, на .site евро.
    (HL + "100 000 рублей в месяц</span>", HL + "1250 евро в месяц</span>"),
    (HL + "50–100 тысяч в месяц</span>",   HL + "600–1250 евро в месяц</span>"),
    (HL + "80–100 тысяч в месяц</span>",   HL + "1000–1250 евро в месяц</span>"),
    ("Вы переводите 100 тысяч",            "Вы переводите 1250 евро"),
    ("те же 100 тысяч за меня",            "те же 1250 евро за меня"),
    ("на них уходит от 50 до 100 тысяч в месяц",
     "на них уходит от 600 до 1250 евро в месяц"),
    ("может быть 50 тысяч, может 100",     "может быть 600 евро, может 1250"),
]


def show(branch, rel):
    """Содержимое файла из ветки. Файла нет — понятная ошибка вместо трейсбека."""
    result = subprocess.run(
        ["git", "show", f"{branch}:{rel}"], capture_output=True,
    )
    if result.returncode != 0:
        sys.exit(f"Сборка зеркала: в ветке {branch} нет файла {rel}.")
    return result.stdout.decode("utf-8")


def write(outdir, rel, text):
    dst = outdir / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(text, encoding="utf-8")
    print(rel)


def main():
    if len(sys.argv) != 3:
        sys.exit("Использование: build.py <ветка> <папка-для-результата>")
    branch, outdir = sys.argv[1], Path(sys.argv[2])

    # Корень зеркала — английская страница.
    write(outdir, "index.html", show(branch, "_mirror/index.en.html"))

    # Русская главная — на /ru/.
    text = show(branch, "index.html")
    for old, new in RU_REPLACEMENTS:
        found = text.count(old)
        if found != 1:
            sys.exit(
                f"Сборка зеркала: в index.html строка «{old[:70]}…» "
                f"встречается {found} раз(а), ожидался ровно один.\n"
                f"Текст на сайте поменялся — поправь замену в _mirror/build.py."
            )
        text = text.replace(old, new)
    write(outdir, "ru/index.html", text)


if __name__ == "__main__":
    main()
