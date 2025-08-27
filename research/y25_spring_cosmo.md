---
title: "2025 Year spring notes 1"
layout: article
---

My master period daily boring notes from seminars, conference, balabala...

---
#### 2025-07-25

**Static nonlinear love numbers of non-rotating compact objects** by Filippo Vernizzi

arxiv: [2312.05065](https://arxiv.org/abs/2312.05065), [2410.03542](https://arxiv.org/abs/2410.03542)


1. Tidal Response and Electromagnetic Analogy

    The tidal response of compact objects (such as neutron stars and black holes) can be described analogously to electromagnetic multipole moments. In the Newtonian case (e.g., Earth-Moon system), the gravitational potential is expanded as:
    $$
    \Phi = G \int d^3x \frac{\rho}{|\vec{x}-\vec{x}'|} + \sum_{\ell \geq 2, m} \mathcal{E}_{\ell m} r^\ell Y_{\ell m}
    $$
    The induced multipole moment is:
    $$
    Q_{\ell m} = \lambda_\ell \mathcal{E}_{\ell m} = k_{\ell} \frac{R^{2\ell+1}}{G} \mathcal{E}_{\ell m}
    $$
    where $k_{\ell}$ is the linear tidal Love number, quantifying the object's response to external tidal fields.

    - For black holes in 4D general relativity, $k_\ell = 0$ (no tidal deformation), but in higher dimensions or modified gravity theories, $k_\ell$ can be nonzero, indicating possible tidal deformability for exotic black holes.

    - In GR, tidal perturbations are classified as polar (parity even, e.g., $\delta g_{tt}$) and axial (parity odd, e.g., $\delta g_{tA}$).

2. Worldline Effective Field Theory (EFT)

    The dynamics of compact objects in external fields can be systematically described using EFT:
    $$
    S = S_{EH}[g_{\mu\nu}] + S_{pp}[g_{\mu\nu}, x^\mu(\lambda)]
    $$
    where $S_{EH}$ is the Einstein-Hilbert action and $S_{pp}$ is the point-particle action. This formalism allows the use of Feynman diagrams to compute gravitational interactions and reconstruct the metric perturbatively. The tidal response (TNL) can be defined and matched to results from black hole perturbation theory (BHPT).

3. Black Hole Perturbation Theory (BHPT)

    - The Regge-Wheeler formalism is used to study linear perturbations of Schwarzschild black holes.
    - For Schwarzschild black holes, the quadratic perturbations are finite polynomials, and the tidal Love numbers $k_\ell$ vanish, confirming their rigidity against tidal deformations in 4D GR.

#### 2025-07-24

Cosmo Group Talk by Tsuji

**Could Gravitational Waves Unlock the Inflation Sector?**

Inflation - inflaton :
- unknown scalar field,
- flat potential @slow roll
- not constrained @minimum

$$V^{1/4}\sim \left(\frac{r}{0.1}\right)10^{16} \text{ GeV},\quad r<0.036$$

Inflation v.s. Reheating
- the shape of the potential @ flat regime / @ minimum
- primordial GW / GW from reheating

Inflaton $\phi$ must convert its energy into radiation.

Perturbative reheating EOM: $\ddot{\phi} + 3H\dot{\phi} + V'(\phi) = -\Gamma\dot{\phi}$, $\Gamma$: decay

graviton production from perturbation decay: Bremsstrahlung, Annihilation, Decay, Catalysis

GW spectrum from inflation

$$ \Omega_{GW}=\frac{1}{\rho_c} \frac{d\rho_{GW}}{d\ln f} $$




#### 2025-07-17

Cosmo Group Talk by Takahashi-san

**Axion search with the ultra-high energy gamma-ray observation**

"Ultralight" Dark Matter (non-thermal bosonic fields).

look for Axions: light shining through a wall experiments; Helioscopes; Haloscopes.

Constraints on axions by high-energy astrophysics.

Broad-band spectrum of crab nebula, (Large High Altitude Air Shower Observatory) LHAASO, and HAWC. Ultra-high energy gamma-ray observation.

what should be taken into account:

Modeling the Crab Nebula:  The dust emission -> two at different temperatures and total mass. B-field is important not only for gamma-ray emission but also for axion-photon conversion in Crab Nebula.


#### 2025-07-15

13:00–15:20, discussion with Matsubara-san and Akitsu-san, continuing from the 2025-07-03 meeting.

Recommended papers: [arXiv:2401.15891](https://arxiv.org/abs/2401.15891) (initial idea), [arXiv:1512.07295](https://arxiv.org/abs/1512.07295) (basics)

Fluctuation: $\delta(\vec{k}) = |\delta_{\vec{k}}| e^{i\theta_{\vec{k}}}$. The power spectrum does not contain phase information. For example, $\frac{P(k)}{P_{DM}(k)}$ is nearly 1 on large scales ($k < 1\,\text{h/Mpc}$), but baryonic effects become significant at smaller scales. [arXiv:2401.15891](https://arxiv.org/abs/2401.15891) proposes using the cross-correlation $r(k) = \frac{\langle \delta_{DM}(\vec{k}) \delta_{full}^*(\vec{k}) \rangle}{\sqrt{P_{DM}(k) P_{full}(k)}}$, which contains phase information and is less affected by baryonic effects compared to the power spectrum. The scale $k$ is valid up to approximately $1\,\text{h/Mpc}$.

$$\langle e^{i\theta_{\vec{k}_1}} e^{i\theta_{\vec{k}_2}} \rangle = \text{const}$$

$$\langle e^{i\theta_{\vec{k}_1}} e^{i\theta_{\vec{k}_2}} e^{i\theta_{\vec{k}_3}} \rangle = \langle \cos(\theta_1 + \theta_2 + \theta_3) + i\sin(\theta_1 + \theta_2 + \theta_3) \rangle \\
= F(k_1, k_2, k_3) \text{ or } F(\vec{k}_1, \vec{k}_2, \vec{k}_3) \text{ related to } \cos\theta...$$

For example, $|\langle \delta(\vec{k}) \rangle|^2 = |\delta_{\vec{k}}|^2 e^{i(\theta_{\vec{k}} + \theta_{-\vec{k}})}$. Since $\theta_{-\vec{k}} = -\theta_{\vec{k}}$, we have $|\langle \delta(\vec{k}) \rangle|^2 = |\delta_{\vec{k}}|^2$, which contains no phase information.

Next, consider the volume scaling:

$$N_{\text{max}} \sim \frac{V}{\lambda_{\text{min}}^3} = V \cdot k_{\text{max}}^3$$

where $V$ is the volume of the universe, $\lambda_{\text{min}}$ is the minimum wavelength, and $k_{\text{max}}$ is the maximum wave number. Therefore, for an infinite universe, the number of modes $N_{\text{max}}$ is infinite. In the continuous limit, the infinite universe corresponds to phase correlations disappearing. A loose proof: the signal $\delta_{\vec{k}}$ is of order $1/\sqrt{V}$, and $N_{\vec{k}} \propto V$, so $|\delta_{\vec{k}}|^2 \times N_{\vec{k}}$ is finite. Matsubara-san noted that the signal should scale as $(1/\sqrt{V})^n$.

* Regarding boundary conditions: N-body simulations use periodic boundary conditions, which are equivalent to a toroidal universe. This does not imply an infinite universe, and the phase information remains unchanged.

* For the bispectrum, $p^{(3)} \propto 1/\sqrt{V}$, and $p^N \propto 1/V^{(N-1)/2}$, as found by Matsubara-san. Thus, $\text{Cov}[p^{(3)}, p^{(3)}] \propto 1/V \rightarrow 0$ in the infinite volume limit, which is not interesting.

$$p^{(3)}(k_1, k_2, k_3) = \frac{B(k_1, k_2, k_3)}{\sqrt{P(k_1) P(k_2) P(k_3)}}$$

We aim to measure the three-point correlation function of phase information in N-body and hydrodynamical simulations, as well as in perturbation theory. To verify whether phase information is affected by baryonic effects, we can compare the three-point correlation function in dark matter-only and full simulations. Thus, in the future, dark matter-only simulations may not be sufficient for some scales, and full simulations may be necessary.

As a first step, unrelated to phase information: to verify a Gaussian field, consider normal distributions $g_1$ and $g_2$ that satisfy

$$\delta(\vec{k}) = \sqrt{\frac{P(k)}{2V}} (g_1(\vec{k}) + i g_2(\vec{k})) \rightarrow P(k)$$

where $g_1$ and $g_2$ are independent Gaussian random variables, and $P(k)$ is the input power spectrum. This can be implemented with FFT, i.e., discretization.

Furthermore, for the bispectrum, we can define $\delta_{NG}(\vec{x}) = \delta_{G}(\vec{x}) + \delta_{G}^2(\vec{x})$.

* Discretization: $N^2(k) = V \cdot \delta_D(\vec{k}_1 + \vec{k}_2) P(k) \Rightarrow N(k) = \sqrt{\frac{P(k)}{2V}}$, a normalization factor.

$$\langle \delta(\vec{k})\delta(\vec{k'})
\rangle=(2\pi)^3\delta_D(\vec{k}+\vec{k'})P(k)$$



#### 2025-07-10

Cosmo Group Talk by Jenney

**Quantum Algorithms for Scientific Problems with Applications to Cosmology**

Quantum algorithms can extend beyond unitary operations. Given a quantum state transformation $|\psi'\rangle = U|\psi\rangle$ with unitary $U$, how can we apply a non-unitary (or non-Hermitian) matrix $A$? The solution is *block encoding*: embed $A$ as a block within a larger unitary matrix.

Key Concepts:
- Block Encoding: Represents $A$ as a submatrix of a unitary $U_A$, allowing quantum circuits to simulate non-unitary operations.
- Qubitization: Enables computation of $f(A)|\psi\rangle$ for functions $f$, such as exponentials or Chebyshev polynomials.
- Hermitian Block Encoding: Especially efficient when $A$ is Hermitian.
$$
U_A|0^m\rangle|v_i\rangle = \lambda_i|0^m\rangle|\lambda_i\rangle + \sqrt{1-\lambda_i^2}|\bot_i\rangle
$$
where $U_A$ is the block-encoding unitary, $|v_i\rangle$ is an eigenvector, $\lambda_i$ is the (scaled) eigenvalue, and $|\bot_i\rangle$ is orthogonal to $|0^m\rangle|\lambda_i\rangle$.

Related Techniques:
- Quantum Signal Processing (QSP): Implements polynomial transformations of eigenvalues.
- Quantum Singular Value Transformation (QSVT): Generalizes QSP to singular values, enabling algorithms like HHL for solving linear systems.
- Linear Combination of Unitaries (LCU): Decomposes non-unitary operations into weighted sums of unitaries.
- Bacteria Model in Eternal Inflation: Block encoding and QSVT can efficiently simulate discrete stochastic models (like the bacteria model) relevant for cosmological inflation, providing computational advantages in handling non-unitary evolution and extracting physical observables.



#### 2025-07-04

Journal Club by Akitsu Kazuyuki

**Anatomy of Recent Tensions in Cosmology**

References:  [arXiv:2411.06000](https://arxiv.org/abs/2411.06000) , [arXiv:2503.14470](https://arxiv.org/abs/2503.14470)  , [arXiv:2504.16932](https://arxiv.org/abs/2504.16932), [arXiv:2505.00659](https://arxiv.org/abs/2505.00659)

**$\omega_m$ Deficit:*
    There is a deficit in the matter density parameter $\omega_m$ when comparing different cosmological probes.

*Apparent Preference for Negative $\sum m_\nu$:*
    Some analyses show a preference for "negative" total neutrino mass, indicating tension between CMB and DESI BAO results.

*Parameter Assumptions:*
    - Six cosmological parameters, assuming flat geometry.
    - $\sum m_\nu = 0.06\,\mathrm{eV}$ (minimal mass).
    - Two dimensionful quantities: $T_{CMB0} \rightarrow \omega_\gamma$, $13.6\,\mathrm{eV} \rightarrow a_*$.
    - $\omega_\nu = \frac{\sum m_\nu}{93.1\,\mathrm{eV}}$.

*First Peak Location and Parameter Degeneracies:*
    - The location of the first CMB peak ($\theta$) relates to $D_A^*$, $\omega_\Lambda$, and $H_0$.
    - For flat geometry: $h^2 = \omega_m + \omega_\Lambda$.

*Massive Neutrinos and CMB Lensing:*
    - Neutrinos become non-relativistic after recombination: $1+z_{nr} \sim 113 \frac{m_\nu}{0.06\,\mathrm{eV}}$.
    - CMB lensing helps break the degeneracy between $\omega_m$ and $\omega_\Lambda$.
    - High-$\ell$ CMB power spectrum is enhanced by lensing, allowing $m_\nu$ measurement (suppressed in unlensed spectra).
    - Lensing anomaly: $A_{lens} > 1$ when $C_L^{\phi\phi}$ is enhanced.

*Massive Neutrinos and BAO:*
    - With massive neutrinos: $\omega_m = \omega_c + \omega_b + \omega_\nu > \omega_{cb}$.
    - DESI finds $\omega_m^{BAO} < \omega_{cb}^{CMB}$, indicating tension.
    - BAO is sensitive to $\omega_{cb} + \omega_\nu$; CMB is sensitive to $\omega_{cb} - 0.5\omega_\nu$.
    - With $\sum m_\nu = 0.06\,\mathrm{eV}$, the tension is at $2$–$3\sigma$.

*Optical Depth and CMB:*
    - CMB optical depth:
        $$\tau_{reio} = \sigma_T \int_0^{z_*} \frac{n_e(z')}{H(z')(1+z')} dz'$$
    - Larger $\tau$ relaxes tensions, leading to smaller $\Omega_m$.
    - $A_s (\Omega_m h^2)^2 [1 - 5\Omega_\nu/\Omega_m]$—affects amplitude and tension.
Qubitization
*Possible Solutions:*
    - Tension in optical depth may point to physics beyond flat $\Lambda$ CDM:
        - Dynamical dark energy
        - Negative curvature
        - Decaying dark matter to matter/radiation

*$\Lambda$ CDM Reference:*
    - $\omega_0 = -1$, $\omega_a = 0$ (standard $\Lambda$ CDM; see Sailer et al. 2025)


#### 2025-07-03

Today afternoon, small talk with Matsubara-san:

*Background:*
The Fourier mode of the density field can be written as $\delta_k = |\delta_k| e^{i\theta_k}$. In the standard power spectrum analysis, only the amplitude information is retained: $P(k) \sim \langle |\delta_k|^2 \rangle$, and the phase information $\theta_k$ is lost. However, in the nonlinear regime, the distribution of phases becomes nontrivial and is related to quantities like $\\cos(\theta_k + \cdots)$. Phase information is known to be connected to the morphology of cosmic structures, such as filaments and voids.

*Motivation:*
Hydrodynamical simulations can model baryonic effects on small scales, which are known to suppress the power spectrum. Previous research has studied the distribution of phase angles $\theta$ in $N$-body simulations of nonlinear structure formation, but there is a lack of studies incorporating hydrodynamics. By comparing the phase distributions from $N$-body and hydrodynamical simulations, we can assess whether baryonic effects significantly alter phase information. If the two curves (phase distributions) show no significant difference, it may indicate that expensive hydrodynamical simulations are unnecessary for this aspect of structure formation.

Cosmo Group internal talk by Watanabe

**Primordial Black Hole Hot Spots and Out-of-Equilibrium Dynamics** [paper](https://arxiv.org/pdf/2409.02173)

Q: baryon asymmetry

A: Vanilla leptogenesis involves chemical transport, with $B = \frac{28}{79}(B-L)$. Sphaleron processes and the chiral anomaly relate to changes in baryon and lepton numbers: $\Delta B = \Delta L = 3(\Delta N_{CS} - \Delta H_\gamma)$, involving Chern-Simons number and hypermagnetic helicity. Weak sphalerons play a key role.

Conventional leptogenesis assumes a global temperature, but alternative scenarios consider mechanisms that generate local hot regions, such as primordial black holes (PBH).

Hawking radiation from PBHs has temperature $T_H = \frac{M_{PI}^2}{M}$, and the evaporation rate is $\frac{dM}{dt} = -\frac{\pi g \cdot g_H(T_H)}{480} \frac{M_{PI}^2}{M^2}$. PBHs act as local heaters.

Hot-spot formation occurs as particles are emitted; destructive interference means thermalization happens far from the PBH, not nearby. After thermalized shells form, diffusion spreads energy both outward and inward, with diffusion length $L \sim \sqrt{N} L_{free}$ over time $t$.

For $r < r_{cr} \sim t_{th}$, the PBH is the sole energy source; for $r > r_{cr}$, Hawking radiation deposits energy at radius $r$. The temperature profile around a PBH depends on distance.

The final baryon asymmetry is given by $\frac{q_B}{s} \sim \eta_{sphal} \times \epsilon \times N^{trap}_N \times \frac{N_{PBH}}{s}$. The number of trapped particles, $N^{trap}$, evolves according to $dN \sim -\frac{1}{3T_H} dM$.

The asymmetry parameter $\epsilon$ depends on leptogenesis parameters such as total mixing, mass splitting, and Majorana mass. The number density of PBHs affects the leptogenesis scenario; if the PBH mass decreases, $N^{trap}$ increases due to a shrinking core radius and higher temperature in the hot spot. Increased $U$ leads to stronger coupling and more particle capture.

how primordial black holes (PBHs) can create local hot spots in the early universe, affecting baryon asymmetry through out-of-equilibrium dynamics. The talk covered the role of Hawking radiation, diffusion, and particle trapping in PBH environments, and how these factors modify conventional leptogenesis scenarios. The interplay between PBH properties and particle physics parameters determines the resulting baryon asymmetry.

#### 2025-06-26

Cosmo Group Talk by Mikage

An Accurate Modeling of Nano-Hertz Gravitational Wave Signal from Eccentric Supermassive Binary Black Holes

#### 2025-06-12

Cosmo Group Talk by Akitsu-san

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

