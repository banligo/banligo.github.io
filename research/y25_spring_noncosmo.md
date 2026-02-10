---
title: "2025 Year spring non-cosmo notes"
layout: article
---

---

#### 2025-10-08

[**General Probabilistic Theories**](https://ithems.riken.jp/en/events/lectures-on-general-probabilistic-theories-from-introduction-to-research-participation)

- *Convex geometry, positive cones, and operational formulation of probabilistic models:*
    - Study of state spaces as convex sets, with positive cones representing physically allowed states.
    - Operational models use these structures to describe measurement outcomes and transformations.

- *Composite systems, information-theoretic quantities, symmetries, and Euclidean Jordan algebras:*
    - Composite systems are modeled via tensor products of local state spaces.
    - Information-theoretic quantities (e.g., distinguishability, entropy) depend on the structure of these composites.
    - Symmetries and self-duality play key roles; Euclidean Jordan algebras provide a unifying mathematical framework.

*Locally Quantum Model:*

- Local state spaces:
    $$
    V_+^A = \mathcal{B}(\mathbb{C}^m)^{\delta u}_+,\quad V_+^B = \mathcal{B}(\mathbb{C}^n)^{\delta u}_+
    $$
- Composite systems:
    - Minimal tensor product: $V_+^A *_{min} V_+^B = SEP_{min}$
    - Maximal tensor product: $V_+^A *_{max} V_+^B = SEP_{max}$
    - Separable elements in $\mathcal{B}(\mathbb{C}^n)^{\delta u}_+$

- For $x \in \mathcal{B}(\mathbb{C}^{mn})^{\delta u}$, $x$ is separable if $\operatorname{Tr}(xY) \leq 0$ for all $Y \in SEP_{min}$.

- *Choi-Jamiołkowski isomorphism:* For all $x \in BP_{min}$, there exists a positive map $p: \mathcal{B}(\mathbb{C}^n)^{\delta u} \to \mathcal{B}(\mathbb{C}^m)^{\delta u}$ such that $x = (id \otimes p)\Phi^\dagger$, where $\Phi^\dagger = |\Phi^\dagger\rangle\langle\Phi|$.

- To describe all states in $BP_{min}$, positive but not necessarily completely positive maps are needed (e.g., transpose map $\tau$).

    - *Hurwitz-Schrödinger criterion:* $BP_{min} = \{ X + (id \otimes \tau)(Y) \mid X, Y \in \mathcal{B}(\mathbb{C}^{mn})^{\delta u}_+ \}$

*2-Qubit Case ($m = n = 2$):*

- $$
    V_+^{AB} = \mathcal{B}(\mathbb{C}^2)^{\delta u}_+ \otimes_{min} \mathcal{B}(\mathbb{C}^2)^{\delta u}_+
    $$
- $$
    V_+^{AB*} = \mathcal{B}(\mathbb{C}^2)^{\delta u}_+ \otimes_{max} \mathcal{B}(\mathbb{C}^2)^{\delta u}_+ = \{ X + (id \otimes \tau)(Y) \mid X, Y \in \mathcal{B}(\mathbb{C}^2)^{\delta u}_+ \}
    $$
- Example matrices:
    $$
    \begin{pmatrix}
    1 & 0 & 0 & 0 \\
    0 & 0 & 1 & 0 \\
    0 & 1 & 0 & 0 \\
    0 & 0 & 0 & 1
    \end{pmatrix}
    = (id \otimes \tau)
    \begin{pmatrix}
    1 & 0 & 0 & -1 \\
    0 & 0 & 0 & 0 \\
    0 & 0 & 0 & 0 \\
    -1 & 0 & 0 & 1
    \end{pmatrix}
    $$

*Distinguishability and Orthogonality:*

- For projectors $P_i, M_j$, $Tr(P_i M_j) = \delta_{ij}$ requires orthogonal bases in quantum theory.
- For two pure separable states $P_0 = P_0^A \otimes P_0^B$, $P_1 = P_1^A \otimes P_1^B$:
    $$
    Tr(P_0^A P_1^A) + Tr(P_0^B P_1^B) \leq 1
    $$
    (see [HA Cosbida, Hasob, 2019])

- For finite $n$, the situation differs; Lee considers $(Tr(P_1^A P_1^A))^n \to 0$.

*$n$-Composite System Sequential Models:*

- For a model $(V, V_+, u)$, the $n$-composite system is $((V^{\otimes n}, V_+^{u}, u^{\otimes n}))_n$.
- Once a sequence family is chosen, complete position is determined.

*Symmetric Cones and Euclidean Jordan Algebras:*

- Symmetric cones: strong self-duality and homogeneity $\implies$ unique spectral decomposition.
- For $P \in Stu(V_i)$, there exists a perfectly distinguishable state.
- Euclidean Jordan algebras provide the algebraic structure underlying these cones and state spaces.


#### 2025-08-27

**Challenges to solve few-body problems using quantum machine learning with hybrid quantum and massively parallel computers** by S. Aoyama CRC KEK

#### 2025-08-21

**Some rigidity and dynamical stability results of calibrated submanifolds**
_Chung-Jun Tsai (NCTS, Taiwan)_

- Discussed Dijkgraaf's conjecture, Hodge theory, and the role of the mean curvature vector and its flow in submanifold geometry.
- Explored mechanisms of singularity formation and stability properties of calibrated submanifolds.

**A diagrammatic view of Khovanov homology**
_Taketo Sano (RIKEN, iTHEMS)_

- Presented a physical interpretation of Khovanov homology in the context of 4d and 5d gauge theories.
- Explained the categorification of the Jones polynomial, with the relation $\mathrm{Kh}(K) > J(K)$ for knots $K$.
- Introduced (1+1)-dimensional topological quantum field theory (TQFT) and Bor-Naton's reformulation of Khovanov homology.

#### 2025-07-08

KEK Theory Seminar by Kai Murai (Tohoku U)

**Topological Defects in Multi-Axion Dynamics**

*QCD Axion Potential:*
    $V_{QCD}(a) = \chi(T)\left[1 - \cos\left(\frac{a}{f_a}\right)\right]$, where $\chi(T) = m_a T_a^2$.

*PQ Symmetry Breaking Scenarios:*
- *Pre-inflationary (homogeneous):* $a_{\text{init}}/f = \mathcal{O}(1)$
- *Post-inflationary (defects):* Topological defects form after inflation.

*Topological Defects:*
- *Cosmic Strings:* Arise from a complex field $\Phi$ with a wine-bottle potential $V(\Phi)$.
- *Domain Walls:* Result from explicit breaking of $U(1)$ symmetry to $\mathbb{Z}_{N_{DM}}$,
        $V_{QCD}(a) = \chi(T)\left[1 - \cos\left(N_{DM} \frac{a}{f_a}\right)\right]$.

*Domain Wall Number:*  $N_{DM}$
- For $N_{DM} = 1$, the network decays due to domain wall tension.
- For $N_{DM} > 1$, domain walls can dominate the universe, conflicting with CMB anisotropies (domain wall problem).

 *Avoiding Overclosure:*
- Introduce a bias term to collapse domain walls:
        $$
        V(a) = \chi(T)\left[1 - \cos\left(N_{DM} \frac{a}{f_a}\right)\right] + \epsilon \chi(T)\left[1 - \cos\left(N_{DM} \frac{a}{f_a} + \theta\right)\right]
        $$

 *Multi-Axion Systems:*
- Topological defects are well studied for single-axion models.
- In two-axion systems (two potentials), new phenomena arise:
    - String bundles
    - Induced domain walls
    - Transient bias effects

#### 2025-06-27

Kinchakai by Masahito Yamazaki (UT, IPMU)

**Superstring Theory for Our Universe?**

*Q:* What will 22nd-century historians say about string theory?

- Thomas Kuhn's "paradigm shift" concept is relevant here.

*Quantum Gravity:*
- In principle, there are no free parameters; all "parameters" are determined dynamically.

*Calabi-Yau Manifolds:*
- Provide many moduli: size (Kähler modulus), shape (complex structure modulus).
- Generate rich physics in 4D: matter content, gauge bosons, axions via D-brane wrapping cycles.

*The New Paradigm:*
- Input (Calabi-Yau, D-brane setup) → "Old-fashioned theory" $\mathcal{L}(\theta_1,\theta_2)$ → experimental predictions.
- String theory generates a landscape of possible theories, raising new questions.

*Challenges:*
- In principle, quantum gravity has no free parameters, but in practice, assumptions are needed (e.g., Calabi-Yau geometry).
- Moduli stabilization is a key problem.

*Moduli Stabilization:*
- Shape moduli can be stabilized by turning on gauge flux (Giddings-Kachru-Polchinski, 2001).
- However, the choice of flux number ($\int F = n \in \mathbb{Z}$) is arbitrary.

*Flux Vacua and the String Landscape:*
- Flux vacua are generally expected in extra dimensions.
- Searching for "our universe" among these vacua is computationally hard (possibly NP-hard).
- Anthropic selection may play a role.

*Directions for Progress:*
1. Better understanding of (UV) string theory—it's more than just supergravity.
2. The new paradigm raises new questions: instead of focusing on specific CY/flux/L, look for general patterns, constraints, and lessons.
3. Learn from experiments: String theory $\leftrightarrow$ EFT $\leftrightarrow$ observations (e.g., DESI DR2 hints at dynamical dark energy).
4. Be pragmatic and humble. s

*Recent Research Example:*
- Conjecture in QG: No exact global symmetry (e.g., wormholes [Coleman '88] allow global charge to escape to "other universes").
- No domain wall problem:
    $$V = \frac{\phi^5}{\Lambda}$$
- Gouttenoire-King-Roshen-Wang-White-My ('25): Universe from wormholes to wormholes.

*Summary:*
- String theory is a new framework that raises new questions.
- We should remain open-minded and explore all possible directions.

Journal club by Hamada kenji

**Trans-Planckian Physics Revealed by Renormalizable and Background-Free Quantum Gravity**

> advanced quantum gravity research, focusing on how to build a theory of gravity that works at extremely high energies (the "trans-Planckian" regime), where classical Einstein gravity breaks down.

Problems with Einstein's gravity: The classical theory has issues like unbounded action, singularities (points where physics breaks down), and a coupling constant with the wrong dimensions.

Quantum Gravity Goals: The aim is to create a theory that is both renormalizable (mathematically well-behaved at all scales) and background-free (doesn't assume a fixed spacetime).

Key Concepts:
- Use of Hamiltonian constraints and Schwinger-Dyson equations to quantize gravity.
- Importance of diffeomorphism invariance (coordinate independence) and handling of "ghosts" (unphysical states).
- The quantum gravity action should be determined in a way consistent with cosmological observations (like the CMB).
- Path integral measure is crucial for quantization.
- Singularities and ghosts are considered unphysical and can be eliminated.
- Effective Action & Equations of Motion: Discusses how quantum gravity modifies the equations that govern spacetime, especially during cosmic inflation and phase transitions (like the Big Bang).
- Localized Excitations: Describes how quantum gravity predicts new types of massive, localized objects with properties similar to black holes, possibly related to dark matter or primordial black holes.

