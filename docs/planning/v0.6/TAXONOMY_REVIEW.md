# Taxonomy reconciliation — proposed
Preserve the approved baseline byte-for-byte; projection candidate is derived, not a replacement. Counts: 9 major branches, 32 categories, 123 leaf placements, 109 candidate canonical modules; 141 learning entries plus root. All 13 duplicate groups below are proposed equivalences; 14 redundant placements. No scientific review is implied by structural validation.

| Canonical ID | Original placements | Recommendation |
|---|---|---|
| hidden-markov-models-hmm | directed-graphical-models: Hidden Markov Models (HMM); discrete-latent-variable-models: Hidden Markov Models; markov-models: Hidden Markov Models | Share lesson; retain context |
| deep-belief-networks | directed-graphical-models: Deep Belief Networks; deep-latent-variable-models: Deep Belief Networks | Share lesson; retain context |
| conditional-random-fields-crf | undirected-graphical-models: Conditional Random Fields (CRF); probabilistic-discriminative-models: Conditional Random Fields | Share lesson; retain context |
| boltzmann-machines | undirected-graphical-models: Boltzmann Machines; probabilistic-energy-based-models: Boltzmann Machines | Share lesson; retain context |
| restricted-boltzmann-machines | undirected-graphical-models: Restricted Boltzmann Machines; probabilistic-energy-based-models: RBM | Share lesson; retain context |
| variational-autoencoder-vae | deep-latent-variable-models: Variational Autoencoder (VAE); variational-latent-variable-models: VAE | Share lesson; retain context |
| conditional-vae | deep-latent-variable-models: Conditional VAE; variational-latent-variable-models: CVAE | Share lesson; retain context |
| hierarchical-vae | deep-latent-variable-models: Hierarchical VAE; variational-latent-variable-models: Hierarchical VAE | Share lesson; retain context |
| dirichlet-process-mixture-model | bayesian-nonparametric-models: Dirichlet Process Mixture Model; nonparametric-density-models: Dirichlet Process Mixtures | Share lesson; retain context |
| gaussian-process | bayesian-nonparametric-models: Gaussian Process; stochastic-process-models: Gaussian Processes | Share lesson; retain context |
| nade | autoregressive-models: NADE; neural-autoregressive-models: NADE | Share lesson; retain context |
| made | autoregressive-models: MADE; neural-autoregressive-models: MADE | Share lesson; retain context |
| pixelcnn | autoregressive-models: PixelCNN; neural-autoregressive-models: PixelCNN | Share lesson; retain context |

## Scientific annotations (retain original placements)
- Dirichlet: continuous distribution on a simplex; add multivariate relationship.
- Deep belief network: hybrid directed/undirected architecture, not purely directed; explain top-level undirected RBM.
- Autoregressive Transformers vs GPT-style models: family vs subset, keep distinct; link variant-of where appropriate.
- GAN: implicit distribution, no required tractable density; do not imply Bayesian inference.
- Mixture of experts: conditional gated mixture; probabilistic output distributions are needed for probabilistic interpretation.
- Factor graph: representation, not a single generative model. Broad umbrella entries and other implicit samplers require family lessons, not fabricated single equations.
- Markov chains vs Markov processes: related but not synonyms; explain time/state distinctions.
- MADE: architecture/estimator for autoregressive factorization, not a standalone distribution without output specification.
- Conditional generative and discriminative labels depend on modeled variables and use; avoid mutually exclusive tags.
- Gaussian process: stochastic process, not intrinsically Bayesian; distinguish prior and inference.
- SDE: stochastic evolution specification; distinguish model and numerical solver.
- Add GMM links to latent variable models, RBM links to latent and energy families, MAF links to autoregressive mechanisms. These are supplemental edges, not replacements.
- Baseline stars are research emphasis, not priority or completion flags. Preserve seven targets as metadata (GMM, autoregressive family, MAF, VAE, RBM, GAN, diffusion family).
