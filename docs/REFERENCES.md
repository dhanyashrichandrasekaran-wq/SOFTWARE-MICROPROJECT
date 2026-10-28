# ScamQuest: Academic References & Research Foundation

**Project Title**: ScamQuest: An Interactive, Scenario-Based Digital Scam Awareness and Training System  
**Academic Subject**: Software Engineering IA3 Microproject  

---

## 1. Verified Research Foundation

### Primary Citation
> **Sheng, S., Magnien, B., Kumaraguru, P., Acquisti, A., Cranor, L. F., Hong, J., & Nunge, E. (2007).**  
> *"Anti-Phishing Phil: The Design and Evaluation of a Game That Teaches People Not to Fall for Phish."*  
> *Proceedings of the 3rd Symposium on Usable Privacy and Security (SOUPS 2007)*, Pittsburgh, PA, USA, pp. 88–99.  
> **Official Publication Link**: [https://cups.cs.cmu.edu/soups/2007/proceedings/p88_sheng.pdf](https://cups.cs.cmu.edu/soups/2007/proceedings/p88_sheng.pdf)

### Theoretical Context and Scholarly Support
The empirical study conducted by Sheng et al. (2007) serves as the primary scientific foundation for **ScamQuest**. Their research demonstrated that:
1. **Interactive Learning Superiority**: Users trained through interactive, game-based simulations demonstrated significantly higher retention and phishing detection accuracy than users exposed to standard static security guidelines or passive awareness pamphlets.
2. **Immediate Consequence Feedback**: Experiencing the immediate consequence of falling for a phish in a simulated environment reinforced learning transfer more effectively than delayed or abstract compliance warnings.
3. **URL Inspection Training**: Teaching users to systematically inspect the structure of web addresses (distinguishing legitimate subdomains from deceptive domains) was proven to be a trainable and defensible cognitive skill.

---

## 2. ScamQuest's Proposed Distinctive Contributions

While **Anti-Phishing Phil** established the viability of game-based phishing education in a 2D casual fish simulation, **ScamQuest** addresses specific gaps in higher education training through three distinct design contributions:

1. **Student-Centric Multi-Channel Scenarios**:
   Rather than focusing solely on commercial e-commerce websites, ScamQuest models the real communication vectors encountered by modern college students, including advance-fee remote internship offers, merit scholarship verification, campus IT MFA/SSO expiration notices, student marketplace gift-card fraud, and peer WhatsApp/SMS account takeover codes.

2. **Branching Interactive Decision Graphs**:
   Unlike single-decision binary tests (phish vs. legitimate), ScamQuest models multi-stage branching scenarios with at least three decision points along playable routes, allowing students to investigate intermediate responses (e.g., requesting a welcome package, cross-checking with the university directory, or testing out-of-band communication).

3. **Non-Destructive Alternate Outcome Replay Engine**:
   In traditional learning tools, making an exploratory or suboptimal choice damages a student's permanent evaluation score or forces a full restart. ScamQuest introduces the **Alternate Outcome Replay Engine**, enabling students to complete an authoritative official attempt, receive a certified grade, and subsequently fork into practice replay sessions (`is_replay = 1`) from any prior decision point. This lets students experience catastrophic consequences (such as account takeover or advance-fee loss) without compromising their official benchmark score or dashboard progress.

---

## 3. Standards and Fictional Domain References

- **RFC 2606**: *Reserved Top Level DNS Names*. Eastlake, D., & Panitz, A. (1999). Internet Engineering Task Force (IETF).  
  Defines reserved domain names (`example.com`, `example.edu`, `example.org`, `example.net`) utilized throughout ScamQuest to guarantee complete sandbox isolation and prevent accidental live network traffic.
- **IEEE Std 830-1998 / ISO/IEC/IEEE 29148:2018**: *Systems and Software Engineering &mdash; Life Cycle Processes &mdash; Requirements Engineering*. Institute of Electrical and Electronics Engineers.
