# PATLAS — Scientific canonical reconciliation register

Date: 2026-11-25
Status: REVIEW COPY — NOT PUBLISHED OR IMPLEMENTATION AUTHORITY
Repository: edgemindstudio/PATLAS
Branch: engineering/m001-foundation
Continuity anchor: ba0bc63b643c5e8d093bf2b642d44f10997cf500
Accepted M001 implementation: 736952de13dfe63e468217e9f3f93cb74950c165
Protected main: e7ad3ba499e8bc63d246d38b268251bd6e2b1b77
Planning baseline: v0.6

Review: PATLAS-SCR-001; Founder disposition: PATLAS-SCR-FA-001. Consolidated review record, not a new literature search or runtime registry.

## Scope and sources

Frozen sources at the continuity anchor: docs/planning/v0.6/SOURCE_TREE.txt, MODEL_SCOPE_BASELINE.json, TAXONOMY_PROJECTION_CANDIDATE.json, TAXONOMY_REVIEW.md and REGISTRY_SPEC.md. All three frozen source artifacts remain unchanged. Scientific equivalence is family-level identity, not equality of fitted instances. Original category paths are preserved through category IDs and parent hierarchy; placement IDs below reproduce the existing projection convention. Order is the original zero-based sibling order.

All thirteen groups are approved for scientific equivalence planning. Scientific distinctions and contexts are approved as requirements. Specific additional alias strings and relationship edges below are candidates for future validation and implementation planning, not a frozen data artifact.

## SCR-001 — Hidden Markov Models (HMM)

Canonical ID: `hidden-markov-models-hmm`. Disposition: retain equivalence; preserve all 3 placements.

Mathematical core (representative where appropriate): Standard first-order HMM: p(z1:T,x1:T)=p(z1)p(x1|z1) product[t=2..T] p(zt|z(t-1))p(xt|zt).

Scientific qualifications: Finite-state reference; emissions may be discrete or continuous. Not an observed Markov chain or every DBN/state-space model.

| Original placement ID | Original label | Order | Educational context |
|---|---|---:|---|
| `directed-graphical-models--hidden-markov-models-hmm` | Hidden Markov Models (HMM) | 2 | Directed factorization and conditional independence |
| `discrete-latent-variable-models--hidden-markov-models-hmm` | Hidden Markov Models | 1 | Discrete hidden states and inference |
| `markov-models--hidden-markov-models-hmm` | Hidden Markov Models | 1 | Sequential transitions |

Existing aliases: Hidden Markov Models.

Additional alias candidates: HMM; HMMs; Hidden Markov Model.

Relationship candidates: variant-of Dynamic Bayesian Networks (standard unrolled representation); uses-mechanism Markov Chains; related-to CRF.

Reference: Rabiner (1989), A Tutorial on Hidden Markov Models and Selected Applications in Speech Recognition. Locator: https://doi.org/10.1109/5.18626.

## SCR-002 — Deep Belief Networks

Canonical ID: `deep-belief-networks`. Disposition: retain equivalence; preserve all 2 placements.

Mathematical core (representative where appropriate): Classical DBN: p(h0,...,hL)=p(h(L-1),hL) product[l=0..L-2] p(hl|h(l+1)), h0=x.

Scientific qualifications: Hybrid: upper undirected joint, lower directed conditionals. Not a Deep Boltzmann Machine. DBN also abbreviates Dynamic Bayesian Network.

| Original placement ID | Original label | Order | Educational context |
|---|---|---:|---|
| `directed-graphical-models--deep-belief-networks` | Deep Belief Networks | 4 | Directed lower generative conditionals |
| `deep-latent-variable-models--deep-belief-networks` | Deep Belief Networks | 5 | Hierarchical latent representations |

Existing aliases: None.

Additional alias candidates: Deep Belief Network; Deep Belief Net; DBN/DBNs only with disambiguation.

Relationship candidates: uses-mechanism RBM; related-to Deep Boltzmann Machines.

Reference: Hinton, Osindero & Teh (2006), A Fast Learning Algorithm for Deep Belief Nets. Locator: https://doi.org/10.1162/neco.2006.18.7.1527.

## SCR-003 — Conditional Random Fields (CRF)

Canonical ID: `conditional-random-fields-crf`. Disposition: retain equivalence; preserve all 2 placements.

Mathematical core (representative where appropriate): Discrete-output log-linear example: p(y|x)=exp(sum_k theta_k f_k(y,x))/Z(x), where Z sums over outputs.

Scientific qualifications: Linear-chain CRF is a special case. Not synonymous with unconditional MRF or HMM. Features can depend on the entire observed sequence.

| Original placement ID | Original label | Order | Educational context |
|---|---|---:|---|
| `undirected-graphical-models--conditional-random-fields-crf` | Conditional Random Fields (CRF) | 1 | Graph, potentials, normalization |
| `probabilistic-discriminative-models--conditional-random-fields-crf` | Conditional Random Fields | 3 | Conditional structured prediction |

Existing aliases: Conditional Random Fields.

Additional alias candidates: CRF; CRFs; Conditional Random Field.

Relationship candidates: related-to MRF; related-to HMM.

Reference: Lafferty, McCallum & Pereira (2001), Conditional Random Fields: Probabilistic Models for Segmenting and Labeling Sequence Data. Locator: https://repository.upenn.edu/handle/20.500.14332/6188.

## SCR-004 — Boltzmann Machines

Canonical ID: `boltzmann-machines`. Disposition: retain equivalence; preserve all 2 placements.

Mathematical core (representative where appropriate): Classical binary example: E(s)=-b^T s-0.5 s^T W s, W symmetric with zero diagonal; p(s)=exp(-E(s))/Z.

Scientific qualifications: Visible marginal sums over hidden units. Normalized finite binary model does not imply every energy model is normalized or tractable. Retain RBM and DBM as distinct variants.

| Original placement ID | Original label | Order | Educational context |
|---|---|---:|---|
| `undirected-graphical-models--boltzmann-machines` | Boltzmann Machines | 3 | Symmetric interactions |
| `probabilistic-energy-based-models--boltzmann-machines` | Boltzmann Machines | 0 | Energy, equilibrium, partition function |

Existing aliases: None.

Additional alias candidates: Boltzmann Machine; BM with caution.

Relationship candidates: related-to MRF and Ising Models; RBM and DBM variant-of this family.

Reference: Ackley, Hinton & Sejnowski (1985), A Learning Algorithm for Boltzmann Machines. Locator: https://doi.org/10.1016/S0364-0213(85)80012-4.

## SCR-005 — Restricted Boltzmann Machines

Canonical ID: `restricted-boltzmann-machines`. Disposition: retain equivalence; preserve all 2 placements.

Mathematical core (representative where appropriate): Binary-binary RBM: E(v,h)=-a^T v-b^T h-v^T W h; p(v,h)=exp(-E)/Z. Each layer factorizes conditionally on the other.

Scientific qualifications: No within-layer connections; other visible-unit families require different formulations. Contrastive divergence is a learning method, not an alias.

| Original placement ID | Original label | Order | Educational context |
|---|---|---:|---|
| `undirected-graphical-models--restricted-boltzmann-machines` | Restricted Boltzmann Machines | 4 | Bipartite conditional independence |
| `probabilistic-energy-based-models--restricted-boltzmann-machines` | RBM | 1 | Energy, Gibbs sampling, learning |

Existing aliases: RBM.

Additional alias candidates: RBMs; Restricted Boltzmann Machine.

Relationship candidates: variant-of Boltzmann Machines; related-to DBM; classical DBN uses RBM.

Reference: Hinton (2010 technical report; 2012 chapter), A Practical Guide to Training Restricted Boltzmann Machines. Locator: https://doi.org/10.1007/978-3-642-35289-8_32.

## SCR-006 — Variational Autoencoder (VAE)

Canonical ID: `variational-autoencoder-vae`. Disposition: retain equivalence; preserve all 2 placements.

Mathematical core (representative where appropriate): p(x,z)=p(z)p_theta(x|z), q_phi(z|x); ELBO=E_q[log p_theta(x|z)]-KL(q||p).

Scientific qualifications: Gaussian reparameterization is one implementation, not universal. Not deterministic autoencoder. Conditional, hierarchical and beta variants remain distinct.

| Original placement ID | Original label | Order | Educational context |
|---|---|---:|---|
| `deep-latent-variable-models--variational-autoencoder-vae` | Variational Autoencoder (VAE) | 0 | Latent representation and generation |
| `variational-latent-variable-models--variational-autoencoder-vae` | VAE | 0 | Approximate inference and ELBO |

Existing aliases: VAE.

Additional alias candidates: VAEs; Variational Autoencoders; Variational Auto-Encoder.

Relationship candidates: Conditional VAE, Hierarchical VAE and Beta-VAE variant-of VAE.

Reference: Kingma & Welling (2014), Auto-Encoding Variational Bayes; Kingma & Welling (2019), An Introduction to Variational Autoencoders. Locator: https://arxiv.org/abs/1312.6114 ; https://arxiv.org/abs/1906.02691.

## SCR-007 — Conditional VAE

Canonical ID: `conditional-vae`. Disposition: retain equivalence; preserve all 2 placements.

Mathematical core (representative where appropriate): p(x,z|c)=p_theta(z|c)p_theta(x|z,c), q_phi(z|x,c); conditional ELBO uses reconstruction log likelihood and KL to conditional prior.

Scientific qualifications: Prior may be independent of c. Not merely a classifier attached to autoencoder or Conditional GAN.

| Original placement ID | Original label | Order | Educational context |
|---|---|---:|---|
| `deep-latent-variable-models--conditional-vae` | Conditional VAE | 1 | Controlled latent generation |
| `variational-latent-variable-models--conditional-vae` | CVAE | 1 | Conditional inference and ELBO |

Existing aliases: CVAE.

Additional alias candidates: Conditional Variational Autoencoder; Conditional Variational Autoencoders; CVAEs.

Relationship candidates: variant-of VAE; related-to Conditional GAN.

Reference: Sohn, Lee & Yan (2015), Learning Structured Output Representation Using Deep Conditional Generative Models. Locator: NeurIPS 2015 proceedings (paper title and authors).

## SCR-008 — Hierarchical VAE

Canonical ID: `hierarchical-vae`. Disposition: retain equivalence; preserve all 2 placements.

Mathematical core (representative where appropriate): Representative chain: p(x,z1:L)=p(zL) product[l=1..L-1] p(zl|z(l+1)) p(x|z1); ELBO=E_q[log p(x,z)-log q(z|x)].

Scientific qualifications: Umbrella family; deterministic depth alone is insufficient. Ladder VAE is one example. HVAE ambiguous (also Hamiltonian VAE).

| Original placement ID | Original label | Order | Educational context |
|---|---|---:|---|
| `deep-latent-variable-models--hierarchical-vae` | Hierarchical VAE | 3 | Multiple stochastic levels |
| `variational-latent-variable-models--hierarchical-vae` | Hierarchical VAE | 2 | Variational inference through hierarchies |

Existing aliases: None.

Additional alias candidates: Hierarchical Variational Autoencoder; Hierarchical Variational Autoencoders; Hierarchical VAEs.

Relationship candidates: variant-of VAE; related-to Deep Latent Gaussian Models.

Reference: Sønderby et al. (2016), Ladder Variational Autoencoders. Locator: https://arxiv.org/abs/1602.02282.

## SCR-009 — Dirichlet Process Mixture Model

Canonical ID: `dirichlet-process-mixture-model`. Disposition: retain equivalence; preserve all 2 placements.

Mathematical core (representative where appropriate): G~DP(alpha,G0); theta_i|G~G; x_i|theta_i~F(theta_i). Under stick breaking p(x|G)=sum_k pi_k f(x|theta_k).

Scientific qualifications: DP is a prior on measures, not the mixture itself. Finite observations occupy finitely many components. Kernels need not be Gaussian. Nonparametric does not mean parameter-free.

| Original placement ID | Original label | Order | Educational context |
|---|---|---:|---|
| `bayesian-nonparametric-models--dirichlet-process-mixture-model` | Dirichlet Process Mixture Model | 1 | Random measures and posterior inference |
| `nonparametric-density-models--dirichlet-process-mixture-model` | Dirichlet Process Mixtures | 3 | Flexible mixture density estimation |

Existing aliases: Dirichlet Process Mixtures.

Additional alias candidates: DPMM; DPMMs; Dirichlet Process Mixture; Dirichlet Process Mixture Models.

Relationship candidates: uses-mechanism Dirichlet Process; related-to Finite Mixture Models and GMM.

Reference: Neal (2000), Markov Chain Sampling Methods for Dirichlet Process Mixture Models. Locator: https://doi.org/10.1080/10618600.2000.10474879.

## SCR-010 — Gaussian Process

Canonical ID: `gaussian-process`. Disposition: retain equivalence; preserve all 2 placements.

Mathematical core (representative where appropriate): f~GP(m,k); every finite-dimensional joint distribution is multivariate Gaussian with mean vector m_X and covariance K_XX.

Scientific qualifications: Not intrinsically Bayesian; GP classification, GP latent models and deep GP remain separate.

| Original placement ID | Original label | Order | Educational context |
|---|---|---:|---|
| `bayesian-nonparametric-models--gaussian-process` | Gaussian Process | 2 | Function-space priors and prediction |
| `stochastic-process-models--gaussian-process` | Gaussian Processes | 0 | Random functions and covariance |

Existing aliases: Gaussian Processes.

Additional alias candidates: GP; GPs.

Relationship candidates: related-to Multivariate Gaussian and Wiener Processes; GP classification/latent models use GP mechanism.

Reference: Rasmussen & Williams (2006), Gaussian Processes for Machine Learning, Ch. 2. Locator: https://gaussianprocess.org/gpml/.

## SCR-011 — NADE

Canonical ID: `nade`. Disposition: retain equivalence; preserve all 2 placements.

Mathematical core (representative where appropriate): p(x)=product_i p(x_i|x_<i). Original binary NADE: h_i=sigmoid(c+W_:,<i x_<i); p(x_i=1|x_<i)=sigmoid(b_i+V_i,: h_i).

Scientific qualifications: Ordering need not be time. Distinct from linear AR, RBM and MADE. Normalized conditionals avoid a global partition function.

| Original placement ID | Original label | Order | Educational context |
|---|---|---:|---|
| `autoregressive-models--nade` | NADE | 4 | Chain rule and variable ordering |
| `neural-autoregressive-models--nade` | NADE | 0 | Neural parameter sharing and likelihood |

Existing aliases: None.

Additional alias candidates: Neural Autoregressive Distribution Estimator.

Relationship candidates: related-to MADE and RBM.

Reference: Larochelle & Murray (2011), The Neural Autoregressive Distribution Estimator. Locator: https://proceedings.mlr.press/v15/larochelle11a.html.

## SCR-012 — MADE

Canonical ID: `made`. Disposition: retain equivalence; preserve all 2 placements.

Mathematical core (representative where appropriate): Masked layer h=g((W⊙M)h_prev+b); valid autoregressive masks and normalized outputs give p(x)=product_i p(x_i|x_<i).

Scientific qualifications: Mask alone does not define a probability distribution; output family and normalization required. Not ordinary autoencoder. Distinct from NADE.

| Original placement ID | Original label | Order | Educational context |
|---|---|---:|---|
| `autoregressive-models--made` | MADE | 5 | Ordered dependencies |
| `neural-autoregressive-models--made` | MADE | 1 | Masked neural connections |

Existing aliases: None.

Additional alias candidates: Masked Autoencoder for Distribution Estimation.

Relationship candidates: related-to NADE and PixelCNN; MAF/IAF uses-mechanism MADE only for implementations using it.

Reference: Germain, Gregor, Murray & Larochelle (2015), MADE: Masked Autoencoder for Distribution Estimation. Locator: https://proceedings.mlr.press/v37/germain15.html.

## SCR-013 — PixelCNN

Canonical ID: `pixelcnn`. Disposition: retain equivalence; preserve all 2 placements.

Mathematical core (representative where appropriate): p(x)=product_i p(x_i|x_<i). Representative RGB factorization: p(r_i|past)p(g_i|past,r_i)p(b_i|past,r_i,g_i).

Scientific qualifications: Ordering induced over image variables, not physical time. PixelRNN separate; gated PixelCNN and PixelCNN++ variants, not exact aliases.

| Original placement ID | Original label | Order | Educational context |
|---|---|---:|---|
| `autoregressive-models--pixelcnn` | PixelCNN | 6 | Ordered conditional generation |
| `neural-autoregressive-models--pixelcnn` | PixelCNN | 2 | Causal convolution |

Existing aliases: None.

Additional alias candidates: None required.

Relationship candidates: related-to PixelRNN and MADE.

Reference: van den Oord, Kalchbrenner & Kavukcuoglu (2016), Pixel Recurrent Neural Networks; van den Oord et al. (2016), Conditional Image Generation with PixelCNN Decoders. Locator: https://proceedings.mlr.press/v48/oord16.html ; https://arxiv.org/abs/1606.05328.

## Cross-cutting planning requirements

- Preserve original labels, paths, order and IDs. Keep frozen baseline, source tree and candidate projection immutable; eventual versioned interpretation must be additive and separately approved.
- Exact alias is distinct from ambiguous search term and related model. DBN must not exclusively resolve to Deep Belief Networks; BM and HVAE require caution. Additional alias collision checks across the entire inventory remain pending.
- Preserve branch-specific teaching context alongside a shared canonical lesson. Distinguish family, model, process, architecture, representation and method. Existing kind vocabulary is preferred; finer metadata is a future design decision.
- Relationships must use validated endpoints, direction and cycle rules from the registry contract. Membership derives from placements. Relationship candidates are not a complete graph.
- Other 96 canonical identities are not exhaustively scientifically reviewed. Remaining annotations include Dirichlet simplex support, GPT-style versus autoregressive Transformers, implicit GAN density, probabilistic mixture-of-experts, factor graphs as representations, Markov chains/processes, conditional/discriminative distinctions, SDE versus solvers, GMM/RBM/MAF cross-links and seven research-emphasis flags. No priority or completion status follows from these flags.

## Evidence limitations

This consolidates the prior Lead review and its cited bibliographic references. Some sources were available only as abstracts/indexed excerpts; Neal's publisher full text was unavailable in that review. Reference locators are bibliographic aids, not a claim of fresh link or full-text verification in this preparation turn. The original review included explanatory illustrations, not measured experiments. No additional scientific results are claimed. All 13 equivalence decisions are approved, not all lesson content or runtime data. No repository changes or registry freeze authorized.
