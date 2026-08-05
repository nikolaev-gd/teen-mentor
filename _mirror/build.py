# -*- coding: utf-8 -*-
"""Чем зеркало nikolaev-mentor.site отличается от основного сайта nikolaev-mentor.ru.

Единственная разница — валюта в блоке «Деньги» на главной: на .ru рубли,
на .site евро. Всё остальное на двух сайтах одинаково.

Курс, по которому пересчитаны суммы: 100 000 ₽ = 1250 €, то есть 80 ₽ за евро.
Суммы округлены до круглых.

Кто это запускает: ~/Dev/tools/sync-mirror-site.sh при каждом git push.
Скрипт берёт файлы из ветки main, применяет замены и кладёт результат
в дерево зеркала. Рабочая копия и сам сайт .ru не трогаются.

Если строка из левой колонки не найдена в файле ровно один раз — сборка
падает с ошибкой и push не проходит. Так правка текста про деньги на .ru
не разъедется с зеркалом молча: сначала поправь замену здесь.

Папка называется с подчёркивания намеренно: GitHub Pages прогоняет сайт
через Jekyll, а тот не публикует ничего, что начинается с «_».
"""

import subprocess
import sys
from pathlib import Path

HL = '<span style="color:#8FC7A8;font-weight:600">'

REPLACEMENTS = {
    "index.html": [
        (
            HL + "100 000 рублей в месяц</span>",
            HL + "1250 евро в месяц</span>",
        ),
        (
            HL + "50–100 тысяч в месяц</span>",
            HL + "600–1250 евро в месяц</span>",
        ),
        (
            HL + "80–100 тысяч в месяц</span>",
            HL + "1000–1250 евро в месяц</span>",
        ),
        (
            "Вы переводите 100 тысяч",
            "Вы переводите 1250 евро",
        ),
        (
            "те же 100 тысяч за меня",
            "те же 1250 евро за меня",
        ),
        (
            "на них уходит от 50 до 100 тысяч в месяц",
            "на них уходит от 600 до 1250 евро в месяц",
        ),
        (
            "может быть 50 тысяч, может 100",
            "может быть 600 евро, может 1250",
        ),
    ],
}


def main():
    if len(sys.argv) != 3:
        sys.exit("Использование: build.py <ветка> <папка-для-результата>")
    branch, outdir = sys.argv[1], Path(sys.argv[2])

    for rel, pairs in REPLACEMENTS.items():
        text = subprocess.run(
            ["git", "show", f"{branch}:{rel}"],
            check=True, capture_output=True,
        ).stdout.decode("utf-8")

        for old, new in pairs:
            found = text.count(old)
            if found != 1:
                sys.exit(
                    f"Сборка зеркала: в {rel} строка «{old[:70]}…» "
                    f"встречается {found} раз(а), ожидался ровно один.\n"
                    f"Текст на сайте поменялся — поправь замену в _mirror/build.py."
                )
            text = text.replace(old, new)

        dst = outdir / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(text, encoding="utf-8")
        print(rel)


if __name__ == "__main__":
    main()
