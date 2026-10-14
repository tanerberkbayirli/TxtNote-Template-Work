# Mission 08 audit: variable cover/special pages

Extra pages = special-section PDF pages minus baseline. Overlap = text line boxes intersecting (PyMuPDF). out-of-margin = text within 12 mm of page edge (also counted in baseline; broken = more than baseline).

## Counts per variant (OK / broken / n.a.)

- base: 26 OK, 0 broken, 0 n/a
- title400: 16 OK, 10 broken, 1 n/a
- title120: 22 OK, 5 broken, 1 n/a
- coadv: 14 OK, 2 broken, 13 n/a
- jury5: 15 OK, 1 broken, 13 n/a

## Worst offenders

1. aku-fbe-master-tr-v1 / title400: extra=2, +overlaps=0, +oom=0 []
2. aku-sosyoloji-lisans-tr-v1 / title400: extra=2, +overlaps=0, +oom=0 []
3. aku-fbe-phd-tr-v1 / title400: extra=1, +overlaps=0, +oom=0 []
4. aku-sagbil-phd-tr-v1 / title400: extra=1, +overlaps=0, +oom=0 []
5. aku-sagbil-master-tr-v1 / title400: extra=1, +overlaps=0, +oom=0 []
6. aku-sbe-master-en-v1 / title400: extra=1, +overlaps=0, +oom=0 []
7. aku-sbe-phd-en-v1 / title400: extra=1, +overlaps=0, +oom=0 []
8. aku-fbe-master-tr-v1 / title120: extra=1, +overlaps=0, +oom=0 []
9. aku-fbe-phd-tr-v1 / title120: extra=1, +overlaps=0, +oom=0 []
10. aku-sbe-master-tr-v1 / title120: extra=1, +overlaps=0, +oom=0 []
11. aku-sbe-phd-tr-v1 / title120: extra=1, +overlaps=0, +oom=0 []
12. aku-sbe-sanatta-yeterlik-tr-v1 / title120: extra=1, +overlaps=0, +oom=0 []
13. aku-fbe-master-tr-v1 / coadv: extra=1, +overlaps=0, +oom=0 []
14. aku-fbe-phd-tr-v1 / coadv: extra=1, +overlaps=0, +oom=0 []
15. aku-fbe-master-tr-v1 / jury5: extra=1, +overlaps=0, +oom=0 []
16. afsu-tip-uzmanlik-tr-v1 / title400: extra=0, +overlaps=3, +oom=0 ['ov:outer-cover:KARŞILAŞTIRMALI OLARAK İNCELEN|Hazırlayan; outer-cover:OKURYAZARLIĞIN ÇEVRİMİÇİ ÖĞREN|Hazırlayan']
17. iyte-lee-articles-master-en-v1 / title400: extra=0, +overlaps=1, +oom=0 ['ov:outer-cover:Çağrı Şükrü ÖZDOĞAN|İzmir Institute of Technology']
18. iyte-lee-articles-phd-en-v1 / title400: extra=0, +overlaps=1, +oom=0 ['ov:outer-cover:Çağrı Şükrü ÖZDOĞAN|İzmir Institute of Technology']

## All results

| target | variant | extra pages | overlaps | out-of-margin | notes |
|---|---|---|---|---|---|
| adu-sagbil-master-tr-v1 | base | 0 | 0 | 0 |  |
| adu-ziraat-lisans-tr-v1 | base | 0 | 0 | 0 |  |
| afsu-lee-master-tr-v1 | base | 0 | 0 | 0 |  |
| afsu-eczacilik-proje-lisans-tr-v1 | base | 0 | 0 | 0 |  |
| afsu-lee-phd-tr-v1 | base | 0 | 0 | 0 |  |
| afsu-tip-uzmanlik-tr-v1 | base | 0 | 0 | 0 |  |
| aku-fbe-master-tr-v1 | base | 0 | 0 | 0 |  |
| aku-fbe-phd-tr-v1 | base | 0 | 0 | 0 |  |
| aku-felsefe-lisans-tr-v1 | base | 0 | 0 | 0 |  |
| aku-felsefe-seminer-tr-v1 | base | 0 | 0 | 0 |  |
| aku-cografya-lisans-tr-v1 | base | - | - | - | export-fail: ot() before. Instead, call root.render() on the existing root instead if you wan |
| aku-isg-tezsiz-proje-tr-v1 | base | - | - | - | export-fail: ot() before. Instead, call root.render() on the existing root instead if you wan |
| aku-matematik-lisans-tr-v1 | base | 0 | 0 | 0 |  |
| aku-kimya-lisans-tr-v1 | base | - | - | - | export-fail:     at C:\Users\CASPER\Desktop\TxtNote-Template-Work\orchestration\tools\export. |
| aku-mbg-lisans-tr-v1 | base | 0 | 0 | 0 |  |
| aku-sagbil-master-tr-v1 | base | 0 | 0 | 0 |  |
| aku-sagbil-phd-tr-v1 | base | 0 | 0 | 0 |  |
| aku-sbe-master-en-v1 | base | 0 | 0 | 0 |  |
| aku-sbe-master-tr-v1 | base | 0 | 0 | 0 |  |
| aku-sbe-phd-tr-v1 | base | 0 | 0 | 0 |  |
| aku-sbe-phd-en-v1 | base | 0 | 0 | 0 |  |
| aku-sbe-sanatta-yeterlik-tr-v1 | base | 0 | 0 | 0 |  |
| aku-sosyoloji-lisans-tr-v1 | base | 0 | 0 | 0 |  |
| iyte-lee-articles-master-en-v1 | base | 0 | 0 | 0 |  |
| iyte-lee-articles-phd-en-v1 | base | 0 | 0 | 0 |  |
| iyte-eee-undergraduate-en-v1 | base | 0 | 0 | 0 |  |
| iyte-lee-master-en-v1 | base | 0 | 0 | 0 |  |
| iyte-lee-phd-en-v1 | base | 0 | 0 | 0 |  |
| adu-sagbil-master-tr-v1 | title400 | - | - | - | n/a: no such keys in fixture |
| mcbu-tip-uzmanlik-tr-v1 | base | 0 | 0 | 0 |  |
| adu-ziraat-lisans-tr-v1 | title400 | 0 | 0 | 0 |  |
| afsu-eczacilik-proje-lisans-tr-v1 | title400 | 0 | 0 | 0 |  |
| afsu-lee-master-tr-v1 | title400 | - | - | - | analyse-fail: FileNotFoundError(2, 'No such file or directory') |
| afsu-lee-phd-tr-v1 | title400 | - | - | - | export-fail:  at file:///C:/Users/CASPER/Desktop/TxtNote-Template-Work/orchestration/tools/ex |
| afsu-tip-uzmanlik-tr-v1 | title400 | 0 | 3 | 0 | BROKEN ov:outer-cover:KARŞILAŞTIRMALI OLARAK İNCELEN|Hazırlayan; outer-cover:OKURYAZARLIĞIN ÇEVRİMİÇİ ÖĞREN|Hazırlayan |
| aku-cografya-lisans-tr-v1 | title400 | ? | 0 | 0 |  |
| aku-fbe-master-tr-v1 | title400 | 2 | 0 | 0 | BROKEN  |
| aku-fbe-phd-tr-v1 | title400 | 1 | 0 | 0 | BROKEN  |
| aku-felsefe-seminer-tr-v1 | title400 | 0 | 0 | 0 |  |
| aku-felsefe-lisans-tr-v1 | title400 | 0 | 0 | 0 |  |
| aku-isg-tezsiz-proje-tr-v1 | title400 | ? | 0 | 0 |  |
| aku-kimya-lisans-tr-v1 | title400 | ? | 0 | 0 |  |
| aku-matematik-lisans-tr-v1 | title400 | 0 | 0 | 0 |  |
| aku-mbg-lisans-tr-v1 | title400 | 0 | 0 | 0 |  |
| aku-sagbil-phd-tr-v1 | title400 | 1 | 0 | 0 | BROKEN  |
| aku-sagbil-master-tr-v1 | title400 | 1 | 0 | 0 | BROKEN  |
| aku-sbe-master-en-v1 | title400 | 1 | 0 | 0 | BROKEN  |
| aku-sbe-master-tr-v1 | title400 | 0 | 0 | 0 |  |
| aku-sbe-phd-en-v1 | title400 | 1 | 0 | 0 | BROKEN  |
| aku-sbe-phd-tr-v1 | title400 | 0 | 0 | 0 |  |
| aku-sbe-sanatta-yeterlik-tr-v1 | title400 | 0 | 0 | 0 |  |
| aku-sosyoloji-lisans-tr-v1 | title400 | 2 | 0 | 0 | BROKEN  |
| iyte-lee-articles-master-en-v1 | title400 | 0 | 1 | 0 | BROKEN ov:outer-cover:Çağrı Şükrü ÖZDOĞAN|İzmir Institute of Technology |
| iyte-lee-articles-phd-en-v1 | title400 | 0 | 1 | 0 | BROKEN ov:outer-cover:Çağrı Şükrü ÖZDOĞAN|İzmir Institute of Technology |
| iyte-eee-undergraduate-en-v1 | title400 | 0 | 0 | 0 |  |
| iyte-lee-master-en-v1 | title400 | 0 | 0 | 0 |  |
| iyte-lee-phd-en-v1 | title400 | 0 | 0 | 0 |  |
| adu-sagbil-master-tr-v1 | title120 | - | - | - | n/a: no such keys in fixture |
| mcbu-tip-uzmanlik-tr-v1 | title400 | 0 | 0 | 0 |  |
| adu-ziraat-lisans-tr-v1 | title120 | 0 | 0 | 0 |  |
| afsu-lee-master-tr-v1 | title120 | 0 | 0 | 0 |  |
| afsu-eczacilik-proje-lisans-tr-v1 | title120 | 0 | 0 | 0 |  |
| afsu-tip-uzmanlik-tr-v1 | title120 | 0 | 0 | 0 |  |
| afsu-lee-phd-tr-v1 | title120 | 0 | 0 | 0 |  |
| aku-cografya-lisans-tr-v1 | title120 | ? | 0 | 0 |  |
| aku-fbe-master-tr-v1 | title120 | 1 | 0 | 0 | BROKEN  |
| aku-felsefe-lisans-tr-v1 | title120 | 0 | 0 | 0 |  |
| aku-fbe-phd-tr-v1 | title120 | 1 | 0 | 0 | BROKEN  |
| aku-isg-tezsiz-proje-tr-v1 | title120 | ? | 0 | 0 |  |
| aku-felsefe-seminer-tr-v1 | title120 | 0 | 0 | 0 |  |
| aku-matematik-lisans-tr-v1 | title120 | 0 | 0 | 0 |  |
| aku-kimya-lisans-tr-v1 | title120 | ? | 0 | 0 |  |
| aku-mbg-lisans-tr-v1 | title120 | 0 | 0 | 0 |  |
| aku-sagbil-master-tr-v1 | title120 | - | - | - | analyse-fail: FileNotFoundError(2, 'No such file or directory') |
| aku-sagbil-phd-tr-v1 | title120 | 0 | 0 | 0 |  |
| aku-sbe-master-tr-v1 | title120 | -1 | 0 | 0 | BROKEN  |
| aku-sbe-master-en-v1 | title120 | 0 | 0 | 0 |  |
| aku-sbe-phd-en-v1 | title120 | 0 | 0 | 0 |  |
| aku-sbe-phd-tr-v1 | title120 | -1 | 0 | 0 | BROKEN  |
| aku-sosyoloji-lisans-tr-v1 | title120 | 0 | 0 | 0 |  |
| aku-sbe-sanatta-yeterlik-tr-v1 | title120 | -1 | 0 | 0 | BROKEN  |
| iyte-lee-articles-master-en-v1 | title120 | 0 | 0 | 0 |  |
| iyte-lee-articles-phd-en-v1 | title120 | 0 | 0 | 0 |  |
| iyte-eee-undergraduate-en-v1 | title120 | 0 | 0 | 0 |  |
| iyte-lee-master-en-v1 | title120 | 0 | 0 | 0 |  |
| iyte-lee-phd-en-v1 | title120 | 0 | 0 | 0 |  |
| adu-sagbil-master-tr-v1 | coadv | - | - | - | n/a: no such keys in fixture |
| adu-ziraat-lisans-tr-v1 | coadv | - | - | - | n/a: no such keys in fixture |
| afsu-eczacilik-proje-lisans-tr-v1 | coadv | - | - | - | n/a: no such keys in fixture |
| mcbu-tip-uzmanlik-tr-v1 | title120 | 0 | 0 | 0 |  |
| afsu-lee-phd-tr-v1 | coadv | 0 | 0 | 0 |  |
| afsu-tip-uzmanlik-tr-v1 | coadv | - | - | - | n/a: no such keys in fixture |
| aku-cografya-lisans-tr-v1 | coadv | - | - | - | n/a: no such keys in fixture |
| afsu-lee-master-tr-v1 | coadv | 0 | 0 | 0 |  |
| aku-fbe-master-tr-v1 | coadv | 1 | 0 | 0 | BROKEN  |
| aku-felsefe-lisans-tr-v1 | coadv | - | - | - | n/a: no such keys in fixture |
| aku-felsefe-seminer-tr-v1 | coadv | - | - | - | n/a: no such keys in fixture |
| aku-isg-tezsiz-proje-tr-v1 | coadv | - | - | - | n/a: no such keys in fixture |
| aku-kimya-lisans-tr-v1 | coadv | - | - | - | n/a: no such keys in fixture |
| aku-matematik-lisans-tr-v1 | coadv | - | - | - | n/a: no such keys in fixture |
| aku-mbg-lisans-tr-v1 | coadv | - | - | - | n/a: no such keys in fixture |
| aku-fbe-phd-tr-v1 | coadv | 1 | 0 | 0 | BROKEN  |
| aku-sagbil-phd-tr-v1 | coadv | 0 | 0 | 0 |  |
| aku-sagbil-master-tr-v1 | coadv | 0 | 0 | 0 |  |
| aku-sbe-master-en-v1 | coadv | 0 | 0 | 0 |  |
| aku-sbe-master-tr-v1 | coadv | 0 | 0 | 0 |  |
| aku-sbe-phd-en-v1 | coadv | 0 | 0 | 0 |  |
| aku-sbe-phd-tr-v1 | coadv | 0 | 0 | 0 |  |
| aku-sosyoloji-lisans-tr-v1 | coadv | - | - | - | n/a: no such keys in fixture |
| aku-sbe-sanatta-yeterlik-tr-v1 | coadv | 0 | 0 | 0 |  |
| iyte-lee-articles-master-en-v1 | coadv | 0 | 0 | 0 |  |
| iyte-lee-articles-phd-en-v1 | coadv | 0 | 0 | 0 |  |
| iyte-eee-undergraduate-en-v1 | coadv | 0 | 0 | 0 |  |
| iyte-lee-master-en-v1 | coadv | 0 | 0 | 0 |  |
| mcbu-tip-uzmanlik-tr-v1 | coadv | - | - | - | n/a: no such keys in fixture |
| adu-sagbil-master-tr-v1 | jury5 | - | - | - | n/a: no such keys in fixture |
| adu-ziraat-lisans-tr-v1 | jury5 | - | - | - | n/a: no such keys in fixture |
| afsu-eczacilik-proje-lisans-tr-v1 | jury5 | - | - | - | n/a: no such keys in fixture |
| iyte-lee-phd-en-v1 | coadv | 0 | 0 | 0 |  |
| afsu-lee-master-tr-v1 | jury5 | 0 | 0 | 0 |  |
| afsu-tip-uzmanlik-tr-v1 | jury5 | - | - | - | n/a: no such keys in fixture |
| aku-cografya-lisans-tr-v1 | jury5 | - | - | - | n/a: no such keys in fixture |
| afsu-lee-phd-tr-v1 | jury5 | 0 | 0 | 0 |  |
| aku-fbe-master-tr-v1 | jury5 | 1 | 0 | 0 | BROKEN  |
| aku-felsefe-lisans-tr-v1 | jury5 | - | - | - | n/a: no such keys in fixture |
| aku-felsefe-seminer-tr-v1 | jury5 | - | - | - | n/a: no such keys in fixture |
| aku-isg-tezsiz-proje-tr-v1 | jury5 | - | - | - | n/a: no such keys in fixture |
| aku-kimya-lisans-tr-v1 | jury5 | - | - | - | n/a: no such keys in fixture |
| aku-matematik-lisans-tr-v1 | jury5 | - | - | - | n/a: no such keys in fixture |
| aku-mbg-lisans-tr-v1 | jury5 | - | - | - | n/a: no such keys in fixture |
| aku-fbe-phd-tr-v1 | jury5 | 0 | 0 | 0 |  |
| aku-sagbil-master-tr-v1 | jury5 | 0 | 0 | 0 |  |
| aku-sagbil-phd-tr-v1 | jury5 | 0 | 0 | 0 |  |
| aku-sbe-master-tr-v1 | jury5 | 0 | 0 | 0 |  |
| aku-sbe-master-en-v1 | jury5 | 0 | 0 | 0 |  |
| aku-sbe-phd-en-v1 | jury5 | 0 | 0 | 0 |  |
| aku-sbe-phd-tr-v1 | jury5 | 0 | 0 | 0 |  |
| aku-sosyoloji-lisans-tr-v1 | jury5 | - | - | - | n/a: no such keys in fixture |
| aku-sbe-sanatta-yeterlik-tr-v1 | jury5 | 0 | 0 | 0 |  |
| iyte-lee-articles-master-en-v1 | jury5 | 0 | 0 | 0 |  |
| iyte-lee-articles-phd-en-v1 | jury5 | 0 | 0 | 0 |  |
| iyte-eee-undergraduate-en-v1 | jury5 | 0 | 0 | 0 |  |
| iyte-lee-master-en-v1 | jury5 | 0 | 0 | 0 |  |
| mcbu-tip-uzmanlik-tr-v1 | jury5 | - | - | - | n/a: no such keys in fixture |
| iyte-lee-phd-en-v1 | jury5 | 0 | 0 | 0 |  |
