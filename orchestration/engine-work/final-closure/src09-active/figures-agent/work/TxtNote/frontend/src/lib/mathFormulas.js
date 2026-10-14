/**
 * Searchable math catalog for the formula toolbar.
 */

import { foldSearch } from "./noteSearch.js";

export const MATH_FORMULA_PRESETS = [
  {
    "name": "İkinci Dereceden Denklem Çözümü",
    "latex": "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"
  },
  {
    "name": "Binom Açılımı",
    "latex": "(x+y)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^{n-k} y^k"
  },
  {
    "name": "İki Kare Farkı",
    "latex": "a^2 - b^2 = (a-b)(a+b)"
  },
  {
    "name": "Tam Kare (Toplam)",
    "latex": "(a+b)^2 = a^2 + 2ab + b^2"
  },
  {
    "name": "Tam Kare (Fark)",
    "latex": "(a-b)^2 = a^2 - 2ab + b^2"
  },
  {
    "name": "Küp Toplamı",
    "latex": "a^3 + b^3 = (a+b)(a^2 - ab + b^2)"
  },
  {
    "name": "Küp Farkı",
    "latex": "a^3 - b^3 = (a-b)(a^2 + ab + b^2)"
  },
  {
    "name": "Aritmetik Dizi Genel Terimi",
    "latex": "a_n = a_1 + (n-1)d"
  },
  {
    "name": "Aritmetik Dizi Toplamı",
    "latex": "S_n = \\frac{n}{2}(a_1 + a_n)"
  },
  {
    "name": "Geometrik Dizi Genel Terimi",
    "latex": "a_n = a_1 \\cdot r^{n-1}"
  },
  {
    "name": "Geometrik Dizi Toplamı",
    "latex": "S_n = a_1 \\frac{1-r^n}{1-r}"
  },
  {
    "name": "Sonsuz Geometrik Seriler",
    "latex": "S = \\frac{a}{1-r} \\quad (|r| < 1)"
  },
  {
    "name": "Mutlak Değer Üçgen Eşitsizliği",
    "latex": "|a + b| \\le |a| + |b|"
  },
  {
    "name": "Aritmetik ve Geometrik Ortalama Eşitsizliği (AM-GM)",
    "latex": "\\frac{a+b}{2} \\ge \\sqrt{ab}"
  },
  {
    "name": "Cauchy-Schwarz Eşitsizliği",
    "latex": "(\\sum a_i b_i)^2 \\le (\\sum a_i^2)(\\sum b_i^2)"
  },
  {
    "name": "Logaritma Çarpım Kuralı",
    "latex": "\\log_b(xy) = \\log_b(x) + \\log_b(y)"
  },
  {
    "name": "Logaritma Bölüm Kuralı",
    "latex": "\\log_b(x/y) = \\log_b(x) - \\log_b(y)"
  },
  {
    "name": "Logaritma Üs Kuralı",
    "latex": "\\log_b(x^k) = k \\log_b(x)"
  },
  {
    "name": "Logaritma Taban Değiştirme",
    "latex": "\\log_b(a) = \\frac{\\log_c(a)}{\\log_c(b)}"
  },
  {
    "name": "Doğal Logaritma - Üstel İlişki",
    "latex": "e^{\\ln(x)} = x"
  },
  {
    "name": "Pisagor Teoremi",
    "latex": "a^2 + b^2 = c^2"
  },
  {
    "name": "Üçgenin Alanı (Taban ve Yükseklik)",
    "latex": "A = \\frac{1}{2} b h"
  },
  {
    "name": "Üçgenin Alanı (Sinüs ile)",
    "latex": "A = \\frac{1}{2} ab \\sin(C)"
  },
  {
    "name": "Heron Formülü",
    "latex": "A = \\sqrt{s(s-a)(s-b)(s-c)}, \\quad s = \\frac{a+b+c}{2}"
  },
  {
    "name": "Kosinüs Teoremi",
    "latex": "c^2 = a^2 + b^2 - 2ab \\cos(C)"
  },
  {
    "name": "Sinüs Teoremi",
    "latex": "\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R"
  },
  {
    "name": "Dairenin Çevresi",
    "latex": "C = 2\\pi r"
  },
  {
    "name": "Dairenin Alanı",
    "latex": "A = \\pi r^2"
  },
  {
    "name": "Trigonometrik Özdeşlik (Temel)",
    "latex": "\\sin^2(\\theta) + \\cos^2(\\theta) = 1"
  },
  {
    "name": "Eğim (İki Noktadan Geçen)",
    "latex": "m = \\frac{y_2 - y_1}{x_2 - x_1}"
  },
  {
    "name": "İki Nokta Arasındaki Mesafe",
    "latex": "d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}"
  },
  {
    "name": "Orta Nokta Formülü",
    "latex": "M = \\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right)"
  },
  {
    "name": "Küre Hacmi",
    "latex": "V = \\frac{4}{3}\\pi r^3"
  },
  {
    "name": "Küre Yüzey Alanı",
    "latex": "A = 4\\pi r^2"
  },
  {
    "name": "Silindir Hacmi",
    "latex": "V = \\pi r^2 h"
  },
  {
    "name": "Koninin Hacmi",
    "latex": "V = \\frac{1}{3}\\pi r^2 h"
  },
  {
    "name": "Dikdörtgenler Prizması Hacmi",
    "latex": "V = l w h"
  },
  {
    "name": "Tanjant-Sinüs-Kosinüs İlişkisi",
    "latex": "\\tan(\\theta) = \\frac{\\sin(\\theta)}{\\cos(\\theta)}"
  },
  {
    "name": "Sekant ve Tanjant İlişkisi",
    "latex": "1 + \\tan^2(\\theta) = \\sec^2(\\theta)"
  },
  {
    "name": "Kosekant ve Kotanjant İlişkisi",
    "latex": "1 + \\cot^2(\\theta) = \\csc^2(\\theta)"
  },
  {
    "name": "Sinüs Toplam Formülü",
    "latex": "\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta"
  },
  {
    "name": "Sinüs Fark Formülü",
    "latex": "\\sin(\\alpha - \\beta) = \\sin\\alpha\\cos\\beta - \\cos\\alpha\\sin\\beta"
  },
  {
    "name": "Kosinüs Toplam Formülü",
    "latex": "\\cos(\\alpha + \\beta) = \\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta"
  },
  {
    "name": "Kosinüs Fark Formülü",
    "latex": "\\cos(\\alpha - \\beta) = \\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta"
  },
  {
    "name": "Tanjant Toplam Formülü",
    "latex": "\\tan(\\alpha + \\beta) = \\frac{\\tan\\alpha + \\tan\\beta}{1 - \\tan\\alpha\\tan\\beta}"
  },
  {
    "name": "Sinüs İki Kat Açı",
    "latex": "\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta"
  },
  {
    "name": "Kosinüs İki Kat Açı",
    "latex": "\\cos(2\\theta) = \\cos^2\\theta - \\sin^2\\theta"
  },
  {
    "name": "Tanjant İki Kat Açı",
    "latex": "\\tan(2\\theta) = \\frac{2\\tan\\theta}{1 - \\tan^2\\theta}"
  },
  {
    "name": "Sinüs Yarım Açı",
    "latex": "\\sin\\left(\\frac{\\theta}{2}\\right) = \\pm\\sqrt{\\frac{1 - \\cos\\theta}{2}}"
  },
  {
    "name": "Kosinüs Yarım Açı",
    "latex": "\\cos\\left(\\frac{\\theta}{2}\\right) = \\pm\\sqrt{\\frac{1 + \\cos\\theta}{2}}"
  },
  {
    "name": "Türevin Tanımı",
    "latex": "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}"
  },
  {
    "name": "Üs Kuralı (Türev)",
    "latex": "\\frac{d}{dx}[x^n] = n x^{n-1}"
  },
  {
    "name": "Çarpım Kuralı (Türev)",
    "latex": "(uv)' = u'v + uv'"
  },
  {
    "name": "Bölüm Kuralı (Türev)",
    "latex": "\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}"
  },
  {
    "name": "Zincir Kuralı (Türev)",
    "latex": "\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}"
  },
  {
    "name": "e^x Türevi",
    "latex": "\\frac{d}{dx}[e^x] = e^x"
  },
  {
    "name": "\\ln(x) Türevi",
    "latex": "\\frac{d}{dx}[\\ln(x)] = \\frac{1}{x}"
  },
  {
    "name": "Sinüs Türevi",
    "latex": "\\frac{d}{dx}[\\sin x] = \\cos x"
  },
  {
    "name": "Kosinüs Türevi",
    "latex": "\\frac{d}{dx}[\\cos x] = -\\sin x"
  },
  {
    "name": "Tanjant Türevi",
    "latex": "\\frac{d}{dx}[\\tan x] = \\sec^2 x"
  },
  {
    "name": "Üs Kuralı (İntegral)",
    "latex": "\\int x^n dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)"
  },
  {
    "name": "Doğal Logaritma İntegrali",
    "latex": "\\int \\frac{1}{x} dx = \\ln|x| + C"
  },
  {
    "name": "e^x İntegrali",
    "latex": "\\int e^x dx = e^x + C"
  },
  {
    "name": "Sinüs İntegrali",
    "latex": "\\int \\sin x dx = -\\cos x + C"
  },
  {
    "name": "Kosinüs İntegrali",
    "latex": "\\int \\cos x dx = \\sin x + C"
  },
  {
    "name": "Kalkülüsün Temel Teoremi",
    "latex": "\\int_{a}^{b} f(x) dx = F(b) - F(a)"
  },
  {
    "name": "Parçalı İntegrasyon",
    "latex": "\\int u \\, dv = uv - \\int v \\, du"
  },
  {
    "name": "Taylor Serisi Açılımı",
    "latex": "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n"
  },
  {
    "name": "Maclaurin Serisi (e^x)",
    "latex": "e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!}"
  },
  {
    "name": "Maclaurin Serisi (\\sin x)",
    "latex": "\\sin x = \\sum_{n=0}^{\\infty} (-1)^n \\frac{x^{2n+1}}{(2n+1)!}"
  },
  {
    "name": "Maclaurin Serisi (\\cos x)",
    "latex": "\\cos x = \\sum_{n=0}^{\\infty} (-1)^n \\frac{x^{2n}}{(2n)!}"
  },
  {
    "name": "L'Hôpital Kuralı",
    "latex": "\\lim_{x \\to c} \\frac{f(x)}{g(x)} = \\lim_{x \\to c} \\frac{f'(x)}{g'(x)}"
  },
  {
    "name": "Dönel Cisim Hacmi (Disk Yöntemi)",
    "latex": "V = \\pi \\int_{a}^{b} [f(x)]^2 dx"
  },
  {
    "name": "Eğri Uzunluğu",
    "latex": "L = \\int_{a}^{b} \\sqrt{1 + [f'(x)]^2} dx"
  },
  {
    "name": "Euler Özdeşliği",
    "latex": "e^{i\\pi} + 1 = 0"
  },
  {
    "name": "Euler Formülü",
    "latex": "e^{ix} = \\cos x + i\\sin x"
  },
  {
    "name": "De Moivre Formülü",
    "latex": "(\\cos x + i\\sin x)^n = \\cos(nx) + i\\sin(nx)"
  },
  {
    "name": "Karmaşık Sayı Tanımı",
    "latex": "z = a + bi"
  },
  {
    "name": "Karmaşık Sayı Modülü",
    "latex": "|z| = \\sqrt{a^2 + b^2}"
  },
  {
    "name": "Matris Determinantı (2 \\times 2)",
    "latex": "\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc"
  },
  {
    "name": "Matris Tersi (2 \\times 2)",
    "latex": "A^{-1} = \\frac{1}{ad-bc}\\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}"
  },
  {
    "name": "Özdeğer-Özvektör Denklemi",
    "latex": "A\\mathbf{v} = \\lambda\\mathbf{v}"
  },
  {
    "name": "Karakteristik Denklem",
    "latex": "\\det(A - \\lambda I) = 0"
  },
  {
    "name": "İki Vektörün İç Çarpımı (Nokta Çarpımı)",
    "latex": "\\mathbf{u} \\cdot \\mathbf{v} = |\\mathbf{u}||\\mathbf{v}|\\cos\\theta"
  },
  {
    "name": "İki Vektörün Dış Çarpımı (Çapraz Çarpım Boyutu)",
    "latex": "|\\mathbf{u} \\times \\mathbf{v}| = |\\mathbf{u}||\\mathbf{v}|\\sin\\theta"
  },
  {
    "name": "Faktöriyel",
    "latex": "n! = n \\times (n-1) \\times \\dots \\times 1"
  },
  {
    "name": "Permütasyon",
    "latex": "P(n,k) = \\frac{n!}{(n-k)!}"
  },
  {
    "name": "Kombinasyon",
    "latex": "C(n,k) = \\binom{n}{k} = \\frac{n!}{k!(n-k)!}"
  },
  {
    "name": "Bayes Teoremi",
    "latex": "P(A|B) = \\frac{P(B|A)P(A)}{P(B)}"
  },
  {
    "name": "Aritmetik Ortalama",
    "latex": "\\mu = \\frac{\\sum x_i}{N}"
  },
  {
    "name": "Varyans (Popülasyon)",
    "latex": "\\sigma^2 = \\frac{\\sum (x_i - \\mu)^2}{N}"
  },
  {
    "name": "Standart Sapma",
    "latex": "\\sigma = \\sqrt{\\sigma^2}"
  },
  {
    "name": "Z-Puanı",
    "latex": "z = \\frac{x - \\mu}{\\sigma}"
  },
  {
    "name": "Binom Dağılımı Olasılığı",
    "latex": "P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}"
  },
  {
    "name": "Poisson Dağılımı",
    "latex": "P(X = k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}"
  },
  {
    "name": "Standart Normal Dağılım Yoğunluk Fonksiyonu",
    "latex": "f(x) = \\frac{1}{\\sqrt{2\\pi}} e^{-\\frac{x^2}{2}}"
  },
  {
    "name": "Öklid Bölme Algoritması",
    "latex": "a = bq + r \\quad (0 \\le r < b)"
  },
  {
    "name": "Stirling Yaklaşımı (Faktöriyel)",
    "latex": "n! \\approx \\sqrt{2\\pi n} \\left(\\frac{n}{e}\\right)^n"
  },
  {
    "name": "Altın Oran Formülü",
    "latex": "\\phi = \\frac{1 + \\sqrt{5}}{2}"
  },
  {
    "name": "Basel Problemi Toplamı",
    "latex": "\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}"
  },
  {
    "name": "Vandermonde Özdeşliği",
    "latex": "\\binom{m+n}{r} = \\sum_{k=0}^{r} \\binom{m}{k}\\binom{n}{r-k}"
  },
  {
    "name": "Vieta Formülleri (2. Derece)",
    "latex": "x_1+x_2 = -\\frac{b}{a}, \\quad x_1 x_2 = \\frac{c}{a}"
  },
  {
    "name": "Vieta Formülleri (3. Derece Kök Toplamı)",
    "latex": "x_1+x_2+x_3 = -\\frac{b}{a}"
  },
  {
    "name": "Vieta Formülleri (3. Derece Kök Çarpımı)",
    "latex": "x_1 x_2 x_3 = -\\frac{d}{a}"
  },
  {
    "name": "Cardano Formülü (Küp Denklem Kökü)",
    "latex": "x = \\sqrt[3]{q + \\sqrt{q^2 + p^3}} + \\sqrt[3]{q - \\sqrt{q^2 + p^3}}"
  },
  {
    "name": "Harmonic Serilerin Yakınsaklığı (Integral Testi)",
    "latex": "\\sum_{n=1}^{\\infty} \\frac{1}{n} = \\infty"
  },
  {
    "name": "P-Serisi Testi",
    "latex": "\\sum_{n=1}^{\\infty} \\frac{1}{n^p} \\quad (p > 1 \\text{ ise yakınsak})"
  },
  {
    "name": "Oran Testi (Ratio Test)",
    "latex": "L = \\lim_{n \\to \\infty} \\left|\\frac{a_{n+1}}{a_n}\\right|"
  },
  {
    "name": "Kök Testi (Root Test)",
    "latex": "L = \\lim_{n \\to \\infty} \\sqrt[n]{|a_n|}"
  },
  {
    "name": "Alternatif Seri Testi (Leibniz Testi)",
    "latex": "\\sum (-1)^n b_n \\quad (b_{n+1} \\le b_n \\text{ ve } \\lim b_n = 0)"
  },
  {
    "name": "Gamma Fonksiyonu Tanımı",
    "latex": "\\Gamma(z) = \\int_{0}^{\\infty} x^{z-1} e^{-x} dx"
  },
  {
    "name": "Gamma Fonksiyonu Faktöriyel İlişkisi",
    "latex": "\\Gamma(n) = (n-1)!"
  },
  {
    "name": "Beta Fonksiyonu",
    "latex": "B(x,y) = \\int_{0}^{1} t^{x-1}(1-t)^{y-1} dt"
  },
  {
    "name": "Beta ve Gamma İlişkisi",
    "latex": "B(x,y) = \\frac{\\Gamma(x)\\Gamma(y)}{\\Gamma(x+y)}"
  },
  {
    "name": "Yansıma Formülü (Euler)",
    "latex": "\\Gamma(z)\\Gamma(1-z) = \\frac{\\pi}{\\sin(\\pi z)}"
  },
  {
    "name": "Riemann Zeta Fonksiyonu",
    "latex": "\\zeta(s) = \\sum_{n=1}^{\\infty} \\frac{1}{n^s}"
  },
  {
    "name": "Euler Çarpım Formülü (Zeta)",
    "latex": "\\zeta(s) = \\prod_{p \\text{ asal}} \\frac{1}{1 - p^{-s}}"
  },
  {
    "name": "Bernoulli Sayıları Üreteç Fonksiyonu",
    "latex": "\\frac{t}{e^t - 1} = \\sum_{n=0}^{\\infty} B_n \\frac{t^n}{n!}"
  },
  {
    "name": "Lambert W Fonksiyonu Tanımı",
    "latex": "Y = W(Y e^Y)"
  },
  {
    "name": "Laguerre Polinomları Üreteç Fonksiyonu",
    "latex": "\\frac{1}{1-t} e^{-\\frac{xt}{1-t}} = \\sum_{n=0}^{\\infty} L_n(x) t^n"
  },
  {
    "name": "Legendre Polinomları Rodrigues Formülü",
    "latex": "P_n(x) = \\frac{1}{2^n n!} \\frac{d^n}{dx^n}[(x^2-1)^n]"
  },
  {
    "name": "Chebyshev Polinomları (1. Tür)",
    "latex": "T_n(\\cos\\theta) = \\cos(n\\theta)"
  },
  {
    "name": "Hermite Polinomları Rodrigues Formülü",
    "latex": "H_n(x) = (-1)^n e^{x^2} \\frac{d^n}{dx^n}[e^{-x^2}]"
  },
  {
    "name": "Hypergeometric Seri Tanımı",
    "latex": "_2F_1(a,b;c;z) = \\sum_{n=0}^{\\infty} \\frac{(a)_n (b)_n}{(c)_n} \\frac{z^n}{n!}"
  },
  {
    "name": "Digamma Fonksiyonu",
    "latex": "\\psi(x) = \\frac{d}{dx} \\ln \\Gamma(x) = \\frac{\\Gamma'(x)}{\\Gamma(x)}"
  },
  {
    "name": "Hiperbolik Sinüs Tanımı",
    "latex": "\\sinh(x) = \\frac{e^x - e^{-x}}{2}"
  },
  {
    "name": "Hiperbolik Kosinüs Tanımı",
    "latex": "\\cosh(x) = \\frac{e^x + e^{-x}}{2}"
  },
  {
    "name": "Hiperbolik Tanjant Tanımı",
    "latex": "\\tanh(x) = \\frac{\\sinh(x)}{\\cosh(x)}"
  },
  {
    "name": "Hiperbolik Temel Özdeşlik",
    "latex": "\\cosh^2(x) - \\sinh^2(x) = 1"
  },
  {
    "name": "Hiperbolik Sekant Özdeşliği",
    "latex": "1 - \\tanh^2(x) = \\text{sech}^2(x)"
  },
  {
    "name": "Hiperbolik Kosekant Özdeşliği",
    "latex": "\\coth^2(x) - 1 = \\text{csch}^2(x)"
  },
  {
    "name": "Ters Hiperbolik Sinüs",
    "latex": "\\text{arsinh}(x) = \\ln(x + \\sqrt{x^2+1})"
  },
  {
    "name": "Ters Hiperbolik Kosinüs",
    "latex": "\\text{arcosh}(x) = \\ln(x + \\sqrt{x^2-1}) \\quad (x \\ge 1)"
  },
  {
    "name": "Ters Hiperbolik Tanjant",
    "latex": "\\text{artanh}(x) = \\frac{1}{2} \\ln\\left(\\frac{1+x}{1-x}\\right) \\quad (|x| < 1)"
  },
  {
    "name": "Ptolemy Teoremi",
    "latex": "AC \\cdot BD = AB \\cdot CD + BC \\cdot AD"
  },
  {
    "name": "Ceva Teoremi",
    "latex": "\\frac{AF}{FB} \\cdot \\frac{BD}{DC} \\cdot \\frac{CE}{EA} = 1"
  },
  {
    "name": "Menelaus Teoremi",
    "latex": "\\frac{AF}{FB} \\cdot \\frac{BD}{DC} \\cdot \\frac{CE}{EA} = -1"
  },
  {
    "name": "Brahmagupta Formülü (Kirişler Dörtgeni Alanı)",
    "latex": "A = \\sqrt{(s-a)(s-b)(s-c)(s-d)}"
  },
  {
    "name": "Stewart Teoremi",
    "latex": "b^2 m + c^2 n = a (d^2 + mn)"
  },
  {
    "name": "Apollonius Teoremi (Kenortay Uzunluğu)",
    "latex": "b^2 + c^2 = 2m_a^2 + \\frac{1}{2}a^2"
  },
  {
    "name": "İç Açıortay Teoremi",
    "latex": "\\frac{AB}{AC} = \\frac{BD}{DC}"
  },
  {
    "name": "Dış Açıortay Teoremi",
    "latex": "\\frac{AB}{AC} = \\frac{BD}{CD}"
  },
  {
    "name": "Euler Çokyüzlü Formülü",
    "latex": "V - E + F = 2"
  },
  {
    "name": "Düzlemsel Grafik Yüzey Formülü",
    "latex": "V - E + F = 1 + C"
  },
  {
    "name": "Daire Dilimi Alanı",
    "latex": "A = \\frac{1}{2} r^2 \\theta"
  },
  {
    "name": "Yay Uzunluğu",
    "latex": "s = r \\theta"
  },
  {
    "name": "Küresel Üçgen Alanı (Girard Teoremi)",
    "latex": "A = R^2 (\\alpha + \\beta + \\gamma - \\pi)"
  },
  {
    "name": "Ellips Alanı",
    "latex": "A = \\pi a b"
  },
  {
    "name": "Ellips Çevresi (Ramanujan Yaklaşımı)",
    "latex": "C \\approx \\pi [3(a+b) - \\sqrt{(3a+b)(a+3b)}]"
  },
  {
    "name": "Paralelkenar Alanı (Çapraz Çarpım)",
    "latex": "A = |\\mathbf{a} \\times \\mathbf{b}|"
  },
  {
    "name": "Gradient (Gradyan)",
    "latex": "\\nabla f = \\left(\\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}, \\frac{\\partial f}{\\partial z}\\right)"
  },
  {
    "name": "Divergence (Iraksama)",
    "latex": "\\nabla \\cdot \\mathbf{F} = \\frac{\\partial F_x}{\\partial x} + \\frac{\\partial F_y}{\\partial y} + \\frac{\\partial F_z}{\\partial z}"
  },
  {
    "name": "Curl (Dönü / Rotasyon)",
    "latex": "\\nabla \\times \\mathbf{F} = \\det\\begin{pmatrix} \\mathbf{i} & \\mathbf{j} & \\mathbf{k} \\\\ \\frac{\\partial}{\\partial x} & \\frac{\\partial}{\\partial y} & \\frac{\\partial}{\\partial z} \\\\ F_x & F_y & F_z \\end{pmatrix}"
  },
  {
    "name": "Laplacian İşleci",
    "latex": "\\nabla^2 f = \\frac{\\partial^2 f}{\\partial x^2} + \\frac{\\partial^2 f}{\\partial y^2} + \\frac{\\partial^2 f}{\\partial z^2}"
  },
  {
    "name": "Green Teoremi",
    "latex": "\\oint_C (P dx + Q dy) = \\iint_D \\left(\\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y}\\right) dA"
  },
  {
    "name": "Diverjans Teoremi (Gauss Teoremi)",
    "latex": "\\iiint_V (\\nabla \\cdot \\mathbf{F}) dV = \\oiint_S (\\mathbf{F} \\cdot \\mathbf{n}) dS"
  },
  {
    "name": "Stokes Teoremi",
    "latex": "\\iint_S (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{S} = \\oint_C \\mathbf{F} \\cdot d\\mathbf{r}"
  },
  {
    "name": "Yönlü Türev (Directional Derivative)",
    "latex": "D_{\\mathbf{u}} f = \\nabla f \\cdot \\mathbf{u}"
  },
  {
    "name": "Tanjant Düzlemi Denklemi",
    "latex": "z - z_0 = f_x(x_0,y_0)(x - x_0) + f_y(x_0,y_0)(y - y_0)"
  },
  {
    "name": "İki Katlı İntegral Kutupsal Dönüşüm",
    "latex": "dx \\, dy = r \\, dr \\, d\\theta"
  },
  {
    "name": "Üç Katlı İntegral Küresel Dönüşüm",
    "latex": "dx \\, dy \\, dz = \\rho^2 \\sin\\phi \\, d\\rho \\, d\\phi \\, d\\theta"
  },
  {
    "name": "Üç Katlı İntegral Silindirik Dönüşüm",
    "latex": "dx \\, dy \\, dz = r \\, dr \\, d\\theta \\, dz"
  },
  {
    "name": "Jacobian Matris Determinantı",
    "latex": "J = \\det \\frac{\\partial(x,y)}{\\partial(u,v)}"
  },
  {
    "name": "Fourier Serisi Tanımı",
    "latex": "f(x) = \\frac{a_0}{2} + \\sum_{n=1}^{\\infty} \\left(a_n \\cos\\frac{n\\pi x}{L} + b_n \\sin\\frac{n\\pi x}{L}\\right)"
  },
  {
    "name": "Fourier Katsayısı (a_n)",
    "latex": "a_n = \\frac{1}{L} \\int_{-L}^{L} f(x) \\cos\\left(\\frac{n\\pi x}{L}\\right) dx"
  },
  {
    "name": "Fourier Katsayısı (b_n)",
    "latex": "b_n = \\frac{1}{L} \\int_{-L}^{L} f(x) \\sin\\left(\\frac{n\\pi x}{L}\\right) dx"
  },
  {
    "name": "Karmaşık Fourier Serisi",
    "latex": "f(x) = \\sum_{n=-\\infty}^{\\infty} c_n e^{i \\frac{n\\pi x}{L}}"
  },
  {
    "name": "Fourier Dönüşümü",
    "latex": "\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x) e^{-2\\pi i x \\xi} dx"
  },
  {
    "name": "Ters Fourier Dönüşümü",
    "latex": "f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi) e^{2\\pi i x \\xi} d\\xi"
  },
  {
    "name": "Laplace Dönüşümü",
    "latex": "\\mathcal{L}\\{f(t)\\} = F(s) = \\int_{0}^{\\infty} e^{-st} f(t) dt"
  },
  {
    "name": "Ters Laplace Dönüşümü (Bromwich İntegrali)",
    "latex": "f(t) = \\frac{1}{2\\pi i} \\lim_{\\sigma \\to \\infty} \\int_{\\gamma-i\\sigma}^{\\gamma+i\\sigma} e^{st} F(s) ds"
  },
  {
    "name": "Laplace Dönüşümü Türev Kuralı",
    "latex": "\\mathcal{L}\\{f'(t)\\} = s F(s) - f(0)"
  },
  {
    "name": "Konvolüsyon Teoremi (Laplace)",
    "latex": "\\mathcal{L}\\{(f * g)(t)\\} = F(s) G(s)"
  },
  {
    "name": "Dirac Delta Fonksiyonu Eleme Özelliği",
    "latex": "\\int_{-\\infty}^{\\infty} f(t) \\delta(t - t_0) dt = f(t_0)"
  },
  {
    "name": "Heaviside Basamak Fonksiyonu Türevi",
    "latex": "\\frac{d}{dt} H(t) = \\delta(t)"
  },
  {
    "name": "Birinci Dereceden Lineer DD (İntegral Çarpanı)",
    "latex": "\\mu(x) = e^{\\int P(x) dx}"
  },
  {
    "name": "Genel Birinci Dereceden Çözüm",
    "latex": "y = \\frac{1}{\\mu(x)} \\left[ \\int \\mu(x) Q(x) dx + C \\right]"
  },
  {
    "name": "Bernoulli Diferansiyel Denklemi",
    "latex": "y' + P(x)y = Q(x)y^n"
  },
  {
    "name": "Riccati Diferansiyel Denklemi",
    "latex": "y' = q_0(x) + q_1(x)y + q_2(x)y^2"
  },
  {
    "name": "Clairaut Denklemi",
    "latex": "y = x y' + f(y')"
  },
  {
    "name": "Wronskian Determinantı",
    "latex": "W(y_1, y_2) = y_1 y_2' - y_1' y_2"
  },
  {
    "name": "Cauchy-Euler Denklemi",
    "latex": "x^2 y'' + a x y' + b y = 0"
  },
  {
    "name": "Homojen Sabit Katsayılı 2. Derece DD Karakteristik Denklem",
    "latex": "a r^2 + b r + c = 0"
  },
  {
    "name": "Dalga Denklemi (1D)",
    "latex": "\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\frac{\\partial^2 u}{\\partial x^2}"
  },
  {
    "name": "Isı Denklemi (1D)",
    "latex": "\\frac{\\partial u}{\\partial t} = \\alpha \\frac{\\partial^2 u}{\\partial x^2}"
  },
  {
    "name": "Laplace Denklemi (2D)",
    "latex": "\\frac{\\partial^2 u}{\\partial x^2} + \\frac{\\partial^2 u}{\\partial y^2} = 0"
  },
  {
    "name": "Poisson Denklemi",
    "latex": "\\nabla^2 u = f(x,y,z)"
  },
  {
    "name": "d'Alembert Çözümü (Dalga Denklemi)",
    "latex": "u(x,t) = \\frac{1}{2}[f(x-ct) + f(x+ct)]"
  },
  {
    "name": "Bessel Diferansiyel Denklemi",
    "latex": "x^2 y'' + x y' + (x^2 - n^2) y = 0"
  },
  {
    "name": "Legendre Diferansiyel Denklemi",
    "latex": "(1-x^2) y'' - 2x y' + n(n+1) y = 0"
  },
  {
    "name": "Hermite Diferansiyel Denklemi",
    "latex": "y'' - 2x y' + 2\\lambda y = 0"
  },
  {
    "name": "Laguerre Diferansiyel Denklemi",
    "latex": "x y'' + (1-x) y' + n y = 0"
  },
  {
    "name": "Airy Diferansiyel Denklemi",
    "latex": "y'' - x y = 0"
  },
  {
    "name": "Liénard Denklemi",
    "latex": "x'' + f(x)x' + g(x) = 0"
  },
  {
    "name": "Lotka-Volterra Av-Avcı Modeli (Av)",
    "latex": "\\frac{dx}{dt} = \\alpha x - \\beta x y"
  },
  {
    "name": "Lotka-Volterra Av-Avcı Modeli (Avcı)",
    "latex": "\\frac{dy}{dt} = \\delta x y - \\gamma y"
  },
  {
    "name": "Lojistik Büyüme Diferansiyel Denklemi",
    "latex": "\\frac{dP}{dt} = r P \\left(1 - \\frac{P}{K}\\right)"
  },
  {
    "name": "Lojistik Büyüme Çözümü",
    "latex": "P(t) = \\frac{K}{1 + \\left(\\frac{K-P_0}{P_0}\\right) e^{-rt}}"
  },
  {
    "name": "Newton'un Soğuma Kanunu",
    "latex": "\\frac{dT}{dt} = -k (T - T_{\\text{çevre}})"
  },
  {
    "name": "Radyoaktif Bozunma Denklemi",
    "latex": "N(t) = N_0 e^{-\\lambda t}"
  }
];

/** Ranked matches: name prefix, then name contains, then latex contains. */
export function searchMathFormulas(query) {
  const needle = foldSearch(query).trim();
  const ranked = [];
  MATH_FORMULA_PRESETS.forEach((item, index) => {
    const nameFold = foldSearch(item.name);
    const latexFold = foldSearch(item.latex);
    let score = 0;
    if (!needle) score = 1;
    else if (nameFold.startsWith(needle)) score = 3;
    else if (nameFold.includes(needle)) score = 2;
    else if (latexFold.includes(needle)) score = 1;
    if (score) ranked.push({ ...item, index, score });
  });
  ranked.sort((a, b) => b.score - a.score || a.index - b.index);
  return ranked;
}
