---
title: "2025 Year spring notes"
layout: article
---

My master period daily boring notes from seminars, conference, balabala...

---

#### 2025-06-24

#### 2025-06-12 // Cosmo Internal Talk by Akitsu-san 

 Theory of the Error Bar in Local Primordial Non-Gaussianity (PNG)

- **Dominant Signal:** Local PNG signal primarily comes from the squeezed limit of the bispectrum.
- **Estimator for $f_{\text{NL}}$:** The variance of the $ f_{\text{NL}} $ estimator has a correction term, which enhances the signal-to-noise ratio (S/N) when $ f_{\text{NL}} $ is significantly detected.
- **Physical Origin:** The enhancement arises from the modulation of small-scale modes by long-wavelength modes, which is reflected in the variance.
- **Importance of Correction:** The missing term in the variance becomes important for strong $ f_{\text{NL}} $ signals.
- **Optimal Statistic:** According to [astro-ph/0606001](https://arxiv.org/abs/astro-ph/0606001), no alternative statistics (e.g., Minkowski functionals, wavelet-based, or other esoteric methods) outperform the three-point function for constraining $ f_{\text{NL}} $.

 CMB Folklore: BAO Wiggles and Estimator Covariance

- **BAO Smearing:** The baryon acoustic oscillation (BAO) wiggles in the two-point function are smeared by nonlinear effects.
    - **Mitigation:** BAO reconstruction and IR-resummation techniques are used to improve parameter estimation.
- **Covariance of Power Spectrum Estimator:**
    - Includes contributions from the four-point function:
        - Disconnected part: Gaussian
        - Connected part: Non-Gaussian (mode coupling)
    - Signal-to-noise ratio: $ (S/N)^2 = \sum P \, \text{Cov}^{-1} P $
    - Shot noise affects S/N, but its full impact is not yet fully understood.

 Effective Shot Noise in Galaxy Surveys

- **Origin:** Effective shot noise arises from mildly nonlinear scales.
- **Model:** Toy model for galaxy density field: $ d_g = d + \frac{b_2}{2}(d^2 - \langle d^2 \rangle) $
- **Significance:** Effective shot noise is particularly important in galaxy surveys (e.g., 21cm forest survey) and must be mitigated to improve observational accuracy.

Coupling of Long and Short Modes

- **CMB:** Large variance in naive local PNG estimators and covariance in CMB lensing reconstruction are due to long-short mode coupling.
- **LSS:** In large-scale structure, long modes smear BAO wiggles and dominate covariance, while short modes contribute to effective shot noise.

Determination of Power Spectrum Amplitude

- **Challenge:** Historically, determining the amplitude of the power spectrum was resource-intensive.
- **Solution:** A simple, nearly optimal estimator now exists, improving efficiency and accuracy.

Overall Goal

- **Objective:** All these techniques aim to increase the accuracy of cosmological observations and extract maximal information from data by refining estimators, modeling mode coupling, and reducing noise.