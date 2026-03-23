# 📊 Data Engineering Report: Milestone 1
Author: Dhanya S (Support Role - Team A)

# ==============================================================================
#  DOCUMENTATION & STATISTICS
# Implementation: Summarizing dataset health and imbalance handling.
# ==============================================================================

## 1. Executive Summary
[cite_start]This document outlines the data preparation and engineering steps to transform raw datasets into balanced training sets for the SVM, BERT, and NER models[cite: 207, 1340].

## 2. Dataset Statistics
* Total Cleaned Records: 6,337
* Majority Class: Software Issue (3,620 samples)

## 3. Class Distribution (After Deduplication)
| Category | Record Count |
| :--- | :--- |
| Software Issue | 3,620 |
| Hardware Issue | 1,442 |
| ... | ... |

## 4. Handling Imbalance
[cite_start]Implemented Minority Class Upsampling to ensure rare categories like Email Issue receive equal weight[cite: 5].
# ==============================================================================
# ==============================================================================