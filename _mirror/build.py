# -*- coding: utf-8 -*-
"""Чем зеркало nikolaev-mentor.site отличается от основного сайта nikolaev-mentor.ru.

Раскладка зеркала:

    nikolaev-mentor.site/        английская главная — файл _mirror/index.en.html
    nikolaev-mentor.site/ru/     русская главная, цены пересчитаны в евро
    nikolaev-mentor.site/terms/    \
    nikolaev-mentor.site/privacy/   > юридические страницы из _mirror/legal/,
    nikolaev-mentor.site/refunds/  /  нужны для приёма оплаты через Creem
    nikolaev-mentor.site/contact/ /
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
    ('srcset="portrait-1.webp"',   'srcset="../portrait-1.webp"'),
    ('srcset="portrait-2.webp"',   'srcset="../portrait-2.webp"'),
    ('src="portrait-1.jpeg"',      'src="../portrait-1.jpeg"'),
    ('src="portrait-2.jpeg"',      'src="../portrait-2.jpeg"'),
    ('href="products/"',           'href="../products/"'),
    # Ссылки на внутренние страницы: на .site русская главная лежит
    # в /ru/, поэтому весь блок целиком меняем на вариант с «../».
    (
        '<div style="display:flex;flex-direction:column;gap:11px;margin-top:4px">\n<p style="color:#949c95">Отдельно разбираю частые ситуации:</p>\n<a href="deti-i-gadzhety/" style="color:#8FC7A8;border-bottom:1px solid rgba(143,199,168,.45);padding-bottom:1px;align-self:flex-start;line-height:1.45">Дети и гаджеты: что делать родителю</a>\n<a href="proforientaciya-podrostka/" style="color:#8FC7A8;border-bottom:1px solid rgba(143,199,168,.45);padding-bottom:1px;align-self:flex-start;line-height:1.45">Профориентация для подростков: не тесты, а пробы</a>\n<a href="tyutor-ili-repetitor/" style="color:#8FC7A8;border-bottom:1px solid rgba(143,199,168,.45);padding-bottom:1px;align-self:flex-start;line-height:1.45">Чем тьютор отличается от репетитора</a>\n<a href="podrostok-ne-hochet-uchitsya/" style="color:#8FC7A8;border-bottom:1px solid rgba(143,199,168,.45);padding-bottom:1px;align-self:flex-start;line-height:1.45">Подросток не хочет учиться — что с этим делать</a>\n<a href="roditelyam-podrostka/" style="color:#8FC7A8;border-bottom:1px solid rgba(143,199,168,.45);padding-bottom:1px;align-self:flex-start;line-height:1.45">Консультация для родителей подростка</a>\n<a href="vybor-vuza-i-professii/" style="color:#8FC7A8;border-bottom:1px solid rgba(143,199,168,.45);padding-bottom:1px;align-self:flex-start;line-height:1.45">Куда поступать: выбор вуза и направления</a>\n<a href="vygoranie-u-podrostka/" style="color:#8FC7A8;border-bottom:1px solid rgba(143,199,168,.45);padding-bottom:1px;align-self:flex-start;line-height:1.45">Выгорание у подростка</a>\n</div>',
        '<div style="display:flex;flex-direction:column;gap:11px;margin-top:4px">\n<p style="color:#949c95">Отдельно разбираю частые ситуации:</p>\n<a href="../deti-i-gadzhety/" style="color:#8FC7A8;border-bottom:1px solid rgba(143,199,168,.45);padding-bottom:1px;align-self:flex-start;line-height:1.45">Дети и гаджеты: что делать родителю</a>\n<a href="../proforientaciya-podrostka/" style="color:#8FC7A8;border-bottom:1px solid rgba(143,199,168,.45);padding-bottom:1px;align-self:flex-start;line-height:1.45">Профориентация для подростков: не тесты, а пробы</a>\n<a href="../tyutor-ili-repetitor/" style="color:#8FC7A8;border-bottom:1px solid rgba(143,199,168,.45);padding-bottom:1px;align-self:flex-start;line-height:1.45">Чем тьютор отличается от репетитора</a>\n<a href="../podrostok-ne-hochet-uchitsya/" style="color:#8FC7A8;border-bottom:1px solid rgba(143,199,168,.45);padding-bottom:1px;align-self:flex-start;line-height:1.45">Подросток не хочет учиться — что с этим делать</a>\n<a href="../roditelyam-podrostka/" style="color:#8FC7A8;border-bottom:1px solid rgba(143,199,168,.45);padding-bottom:1px;align-self:flex-start;line-height:1.45">Консультация для родителей подростка</a>\n<a href="../vybor-vuza-i-professii/" style="color:#8FC7A8;border-bottom:1px solid rgba(143,199,168,.45);padding-bottom:1px;align-self:flex-start;line-height:1.45">Куда поступать: выбор вуза и направления</a>\n<a href="../vygoranie-u-podrostka/" style="color:#8FC7A8;border-bottom:1px solid rgba(143,199,168,.45);padding-bottom:1px;align-self:flex-start;line-height:1.45">Выгорание у подростка</a>\n</div>',
    ),
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

    # Юридические страницы: файл _mirror/legal/terms.html становится /terms/
    # и так далее. Каталог с index.html внутри, чтобы адрес был без .html.
    for name in ("terms", "privacy", "refunds", "contact"):
        write(outdir, f"{name}/index.html", show(branch, f"_mirror/legal/{name}.html"))

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
