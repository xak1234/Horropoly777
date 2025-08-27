// Enhanced Mobile-Friendly Instruction System for Horropoly
// This system provides comprehensive game rules optimized for all devices

console.log('🩸 Loading Enhanced Mobile-Friendly Instructions System...');

// Enhanced Horror Instructions Modal Function with comprehensive mobile support
function showHorrorInstructions() {
    // Check if modal already exists and remove it to prevent duplicates
    let existingModal = document.getElementById('horror-instructions-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal HTML with enhanced mobile-first design
    const modalHTML = `
    <!-- Enhanced Horror Instructions Modal -->
    <div id="horror-instructions-modal" class="horror-instructions-modal">
        <div class="modal-content">
            <button class="close-btn" onclick="closeHorrorInstructions()" aria-label="Close Instructions">&times;</button>
            
            <div class="modal-header">
                <h1 class="modal-title">🩸 HORROPOLY SURVIVAL GUIDE 🩸</h1>
                <p class="modal-subtitle">Master the cursed board and survive the financial nightmare...</p>
            </div>

            <!-- Enhanced Navigation Tabs with better mobile touch targets -->
            <div class="nav-buttons">
                <button class="nav-btn active" onclick="showInstructionTab('overview')" data-tab="overview">
                    <span class="nav-icon">👹</span>
                    <span class="nav-text">Overview</span>
                </button>
                <button class="nav-btn" onclick="showInstructionTab('steal')" data-tab="steal">
                    <span class="nav-icon">🎴</span>
                    <span class="nav-text">Steal Cards</span>
                </button>
                <button class="nav-btn" onclick="showInstructionTab('lightning')" data-tab="lightning">
                    <span class="nav-icon">⚡</span>
                    <span class="nav-text">Lightning</span>
                </button>
                <button class="nav-btn" onclick="showInstructionTab('paths')" data-tab="paths">
                    <span class="nav-icon">🐍</span>
                    <span class="nav-text">Snake Paths</span>
                </button>
                <button class="nav-btn" onclick="showInstructionTab('special')" data-tab="special">
                    <span class="nav-icon">🎯</span>
                    <span class="nav-text">Special Squares</span>
                </button>
                <button class="nav-btn" onclick="showInstructionTab('survival')" data-tab="survival">
                    <span class="nav-icon">🧟</span>
                    <span class="nav-text">Strategy</span>
                </button>
            </div>

            <!-- Overview Tab -->
            <div id="instruction-tab-overview" class="instruction-tab-content active">
                <div class="instruction-section">
                    <h2 class="section-title">🎯 Game Objective</h2>
                    <p class="section-text">Survive the cursed monopoly board by bankrupting all other players while avoiding your own financial doom. The last player standing wins the nightmare!</p>
                </div>

                <div class="instruction-section">
                    <h2 class="section-title">💀 Basic Game Rules</h2>
                    <div class="rule-grid">
                        <div class="rule-item">
                            <div class="rule-icon">💰</div>
                            <div class="rule-content">
                                <h3>Starting Money</h3>
                                <p>Each player begins with <strong>£5,000</strong> in cursed currency</p>
                            </div>
                        </div>
                        <div class="rule-item">
                            <div class="rule-icon">🎲</div>
                            <div class="rule-content">
                                <h3>Movement</h3>
                                <p>Roll dice to move around the haunted board. <strong>Doubles</strong> grant extra turns!</p>
                            </div>
                        </div>
                        <div class="rule-item">
                            <div class="rule-icon">🏘️</div>
                            <div class="rule-content">
                                <h3>Property Purchase</h3>
                                <p>Buy unowned properties to build your empire of terror</p>
                            </div>
                        </div>
                        <div class="rule-item">
                            <div class="rule-icon">💸</div>
                            <div class="rule-content">
                                <h3>Rent Collection</h3>
                                <p>Collect rent from players who land on your cursed properties</p>
                            </div>
                        </div>
                        <div class="rule-item">
                            <div class="rule-icon">🏗️</div>
                            <div class="rule-content">
                                <h3>Development</h3>
                                <p>Build <strong>graveyards</strong> and <strong>crypts</strong> to increase rent dramatically</p>
                            </div>
                        </div>
                        <div class="rule-item">
                            <div class="rule-icon">💀</div>
                            <div class="rule-content">
                                <h3>Bankruptcy</h3>
                                <p>Run out of money and face elimination from the game</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="instruction-section">
                    <h2 class="section-title">💰 Rent Calculation System</h2>
                    <div class="rent-info">
                        <div class="rent-formula">
                            <h3>Basic Properties:</h3>
                            <ul class="formula-list">
                                <li><strong>Undeveloped:</strong> 1.5 × Property Cost</li>
                                <li><strong>1-2 Graveyards:</strong> 1.5-3.0 × Property Cost</li>
                                <li><strong>3-4 Graveyards:</strong> 4.5-6.0 × Property Cost</li>
                                <li><strong>Crypt (Ultimate):</strong> 5.0 × Property Cost</li>
                            </ul>
                        </div>
                        <div class="rent-formula">
                            <h3>Special Properties:</h3>
                            <ul class="formula-list">
                                <li><strong>Demon Properties:</strong> Properties Owned × £200</li>
                                <li><strong>Cave Property:</strong> Fixed £500 always</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="warning-box">
                    ⚠️ <strong>WARNING:</strong> This is not your grandmother's Monopoly! Properties can be <strong>STOLEN</strong> and supernatural forces affect gameplay!
                </div>
            </div>

            <!-- Steal Cards Tab -->
            <div id="instruction-tab-steal" class="instruction-tab-content">
                <div class="steal-card-section">
                    <h2 class="steal-card-title">🎴 STEAL CARDS - THE ULTIMATE POWER</h2>
                    
                    <div class="steal-info-grid">
                        <div class="steal-card-info earn">
                            <h3><span class="info-icon">📈</span>How to Earn Steal Cards:</h3>
                            <ul class="steal-list">
                                <li><strong>Pass GO 4 Times:</strong> Every 4th time you pass GO, you earn a steal card automatically</li>
                                <li><strong>Glowing Gravestone:</strong> Land on the GO TO JAIL square when it glows <span class="highlight-green">green</span> (random 2-3 minute intervals)</li>
                                <li><strong>Yin-Yang Square:</strong> Small chance when landing on the mystical yin-yang square</li>
                                <li><strong>Snake Path Prizes:</strong> Rare chance to find steal cards on snake paths instead of money</li>
                            </ul>
                        </div>

                        <div class="steal-card-info use">
                            <h3><span class="info-icon">🎯</span>How to Use Steal Cards:</h3>
                            <ul class="steal-list">
                                <li><strong>Double-Click/Double-Tap:</strong> On your turn, double-click any property owned by another player</li>
                                <li><strong>Instant Ownership:</strong> The property immediately becomes yours - no payment required!</li>
                                <li><strong>Development Preserved:</strong> All graveyards and crypts transfer with the property</li>
                                <li><strong>One Use Only:</strong> Each steal card can only be used once - choose wisely!</li>
                            </ul>
                        </div>
                    </div>

                    <div class="go-bonus-section">
                        <h3 class="section-title">💀 GO Bonus & Steal Card System</h3>
                        <div class="go-progression">
                            <div class="go-step">
                                <div class="step-number">1-3</div>
                                <div class="step-content">
                                    <h4>Passes 1-3</h4>
                                    <p>Collect <strong>£250</strong> bonus only</p>
                                </div>
                            </div>
                            <div class="go-step highlight">
                                <div class="step-number">4</div>
                                <div class="step-content">
                                    <h4>4th Pass</h4>
                                    <p>Collect <strong>£250 + STEAL CARD</strong></p>
                                </div>
                            </div>
                            <div class="go-step highlight">
                                <div class="step-number">8</div>
                                <div class="step-content">
                                    <h4>8th Pass</h4>
                                    <p>Collect <strong>£250 + STEAL CARD</strong></p>
                                </div>
                            </div>
                            <div class="go-step">
                                <div class="step-number">∞</div>
                                <div class="step-content">
                                    <h4>Pattern Continues</h4>
                                    <p>Every 4th pass earns a steal card</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="strategy-box steal">
                        🎴 <strong>STEAL CARD STRATEGY:</strong> Save steal cards for the most valuable properties! Crypts and developed properties are prime targets. Steal properties that complete color groups for maximum rent potential!
                    </div>
                </div>
            </div>

            <!-- Lightning Strikes Tab -->
            <div id="instruction-tab-lightning" class="instruction-tab-content">
                <div class="lightning-section">
                    <h2 class="lightning-title">⚡ LIGHTNING STRIKE SYSTEM</h2>
                    
                    <div class="lightning-info-grid">
                        <div class="lightning-info timing">
                            <h3><span class="info-icon">⏰</span>Lightning Strike Timing:</h3>
                            <ul class="lightning-list">
                                <li><strong>Automatic System:</strong> Lightning strikes occur automatically every <strong>70 seconds</strong></li>
                                <li><strong>Random Target:</strong> Any property on the board can be struck</li>
                                <li><strong>Visual Warning:</strong> Dramatic lightning bolt animation appears on the target</li>
                                <li><strong>Audio Cue:</strong> Thunder and lightning sounds alert all players</li>
                            </ul>
                        </div>

                        <div class="lightning-info effects">
                            <h3><span class="info-icon">💥</span>Lightning Strike Effects:</h3>
                            <div class="effect-categories">
                                <div class="effect-category">
                                    <h4>👤 Effects on Players:</h4>
                                    <ul class="effect-list">
                                        <li>Players on struck property lose <strong>£500-1000</strong></li>
                                        <li>Struck players are sent to <strong>JAIL</strong> immediately</li>
                                        <li>Multiple players can be struck simultaneously</li>
                                    </ul>
                                </div>
                                <div class="effect-category">
                                    <h4>🏘️ Effects on Properties:</h4>
                                    <ul class="effect-list">
                                        <li><strong>Destroy Crypts:</strong> Most valuable developments destroyed first</li>
                                        <li><strong>Remove Graveyards:</strong> Random graveyard removal</li>
                                        <li><strong>Transfer Ownership:</strong> Properties can become unowned!</li>
                                        <li><strong>Owned Properties:</strong> Glow red for 2 seconds when struck</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="strategy-box lightning">
                        ⚡ <strong>LIGHTNING SURVIVAL:</strong> Lightning is unpredictable and affects everyone equally. Keep some money in reserve for lightning penalties, and don't over-develop if you're worried about losing investments!
                    </div>
                </div>
            </div>

            <!-- Snake Paths Tab -->
            <div id="instruction-tab-paths" class="instruction-tab-content">
                <div class="paths-section">
                    <h2 class="paths-title">🐍 SNAKE PATH SYSTEM</h2>
                    
                    <div class="paths-info-grid">
                        <div class="path-info entry">
                            <h3><span class="info-icon">🚪</span>Path Entry & Movement:</h3>
                            <ul class="path-list">
                                <li><strong>Snake Path 1:</strong> Enters at specific trigger squares → s1 through s19 → exits to b1</li>
                                <li><strong>Snake Path 2:</strong> Enters at trigger squares → TT1 through TT19 → exits to b9</li>
                                <li><strong>U Path:</strong> Underground path accessible via T7 teleport → u1 through u19</li>
                                <li><strong>Forward Movement:</strong> All paths move forward only - no backward movement</li>
                            </ul>
                        </div>

                        <div class="path-info special">
                            <h3><span class="info-icon">🎲</span>Special Path Rules:</h3>
                            <ul class="path-list">
                                <li><strong>Doubles Rule:</strong> Rolling doubles while on a snake path <em>immediately</em> teleports you to the exit!</li>
                                <li><strong>No Backward Movement:</strong> Unlike normal board movement, paths only go forward</li>
                                <li><strong>Exit Points:</strong> Each path has a predetermined exit square on the main board</li>
                                <li><strong>Path Switching:</strong> Cannot switch between paths once entered</li>
                            </ul>
                        </div>
                    </div>

                    <div class="money-system">
                        <h3 class="section-title">💰 Snake Path Money System</h3>
                        <div class="money-info-grid">
                            <div class="money-info spawn">
                                <h4><span class="money-icon">💎</span>Money Spawning:</h4>
                                <ul class="money-list">
                                    <li>Money appears on <strong>specific path squares</strong>: s8, TT18, and u6</li>
                                    <li><strong>Pulsing Visual:</strong> Money pulses with red background and yellow text</li>
                                    <li><strong>Random Amounts:</strong> £100-£1000 can spawn</li>
                                    <li><strong>Steal Card Chance:</strong> Small chance for steal cards instead of money</li>
                                </ul>
                            </div>
                            <div class="money-info collection">
                                <h4><span class="money-icon">💰</span>Money Collection:</h4>
                                <ul class="money-list">
                                    <li><strong>Automatic Collection:</strong> Money collected when landing on the square</li>
                                    <li><strong>One-Time Only:</strong> Each money spawn can only be collected once</li>
                                    <li><strong>Visual Feedback:</strong> Advisory message shows collection amount</li>
                                    <li><strong>Multiplayer Sync:</strong> Collections synchronized across all players</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="strategy-box paths">
                        🐍 <strong>PATH STRATEGY:</strong> Snake paths can be lucrative with money spawns, but they bypass normal board squares. Use them strategically to avoid dangerous areas or collect path-specific rewards!
                    </div>
                </div>
            </div>

            <!-- Special Squares Tab -->
            <div id="instruction-tab-special" class="instruction-tab-content">
                <div class="special-section">
                    <h2 class="section-title">🎯 Special Squares & Effects</h2>
                    
                    <div class="special-squares-grid">
                        <div class="special-square go">
                            <div class="square-icon">🏠</div>
                            <div class="square-content">
                                <h3>GO Square</h3>
                                <p>Collect <strong>£250</strong> bonus every time you pass or land on GO. Every 4th pass earns a <strong>steal card</strong>. Shows "BONUS!" flash message.</p>
                            </div>
                        </div>

                        <div class="special-square teleport">
                            <div class="square-icon">⚡</div>
                            <div class="square-content">
                                <h3>Teleport Squares</h3>
                                <p><strong>T8 → T1:</strong> Main board teleportation<br>
                                <strong>T7 → U Path:</strong> Underground path access<br>
                                Shows "TELEPORT!" flash with zap sound.</p>
                            </div>
                        </div>

                        <div class="special-square yinyang">
                            <div class="square-icon">☯️</div>
                            <div class="square-content">
                                <h3>Yin-Yang Square</h3>
                                <p>Receive mystical quotes that affect your money (gain or lose <strong>£1-900</strong>). Small chance for <strong>steal card</strong>. Shows "YANG!" flash message.</p>
                            </div>
                        </div>

                        <div class="special-square jail">
                            <div class="square-icon">🏛️</div>
                            <div class="square-content">
                                <h3>GO TO JAIL</h3>
                                <p>Sends you to jail immediately. Sometimes glows <span class="highlight-green">green</span> - land on it while glowing to earn a <strong>steal card</strong>! Shows "DUNGEON" flash.</p>
                            </div>
                        </div>

                        <div class="special-square demon">
                            <div class="square-icon">👹</div>
                            <div class="square-content">
                                <h3>Demon Properties</h3>
                                <p>Special red properties with unique rent calculation: <strong>Number of Demon Properties Owned × £200</strong>. Rent increases as you collect more!</p>
                            </div>
                        </div>

                        <div class="special-square cave">
                            <div class="square-icon">🕳️</div>
                            <div class="square-content">
                                <h3>Cave Property</h3>
                                <p>Unique property with <strong>fixed £500 rent</strong> regardless of development or other factors. Cannot be developed with graveyards or crypts.</p>
                            </div>
                        </div>
                    </div>

                    <div class="flash-messages">
                        <h3 class="section-title">💫 Flash Messages & Audio Cues</h3>
                        <div class="flash-grid">
                            <div class="flash-item">
                                <span class="flash-text bonus">BONUS!</span>
                                <span class="flash-desc">Passing/Landing on GO</span>
                            </div>
                            <div class="flash-item">
                                <span class="flash-text teleport">TELEPORT!</span>
                                <span class="flash-desc">Teleportation squares</span>
                            </div>
                            <div class="flash-item">
                                <span class="flash-text yang">YANG!</span>
                                <span class="flash-desc">Yin-Yang square effects</span>
                            </div>
                            <div class="flash-item">
                                <span class="flash-text dungeon">DUNGEON</span>
                                <span class="flash-desc">Sent to jail</span>
                            </div>
                            <div class="flash-item">
                                <span class="flash-text lightning">⚡ LIGHTNING STRIKE! ⚡</span>
                                <span class="flash-desc">Lightning strikes</span>
                            </div>
                        </div>
                    </div>

                    <div class="strategy-box special">
                        🌟 <strong>ATTENTION TIP:</strong> Pay close attention to visual and audio cues! Flash messages, sound effects, and glowing squares provide crucial gameplay information that can give you strategic advantages!
                    </div>
                </div>
            </div>

            <!-- Survival Tips Tab -->
            <div id="instruction-tab-survival" class="instruction-tab-content">
                <div class="survival-section">
                    <h2 class="section-title">🧟 Advanced Survival Strategies</h2>
                    
                    <div class="strategy-categories">
                        <div class="strategy-category financial">
                            <h3><span class="strategy-icon">💰</span>Financial Management:</h3>
                            <ul class="strategy-list">
                                <li><strong>Reserve Fund:</strong> Always keep £1000-2000 in reserve for unexpected rent payments and lightning penalties</li>
                                <li><strong>Development Strategy:</strong> Crypts give highest rent but cost the most - balance risk vs reward</li>
                                <li><strong>Property Prioritization:</strong> Focus on completing color groups for development opportunities</li>
                                <li><strong>Cash Flow Monitoring:</strong> Watch other players' money levels to predict their next moves and vulnerabilities</li>
                                <li><strong>Demon Property Strategy:</strong> Collect multiple demon properties for exponentially increasing rent</li>
                            </ul>
                        </div>

                        <div class="strategy-category steal">
                            <h3><span class="strategy-icon">🎴</span>Steal Card Tactics:</h3>
                            <ul class="strategy-list">
                                <li><strong>Target Selection:</strong> Save steal cards for the most expensive or developed properties</li>
                                <li><strong>Color Group Completion:</strong> Steal properties that complete color groups for maximum rent potential</li>
                                <li><strong>Defensive Stealing:</strong> Use steal cards to prevent opponents from dominating board areas</li>
                                <li><strong>Timing is Key:</strong> Time your steals when opponents have invested heavily in development</li>
                                <li><strong>Counter-Strategy:</strong> Don't over-develop if you suspect opponents have steal cards</li>
                            </ul>
                        </div>

                        <div class="strategy-category survival">
                            <h3><span class="strategy-icon">⚡</span>Lightning & Path Strategy:</h3>
                            <ul class="strategy-list">
                                <li><strong>Lightning Preparation:</strong> Keep emergency funds for lightning penalties (£500-1000)</li>
                                <li><strong>Development Risk:</strong> Consider lightning risk before heavy property development</li>
                                <li><strong>Snake Path Usage:</strong> Use paths strategically to avoid dangerous board areas</li>
                                <li><strong>Path Money Collection:</strong> Monitor path squares for money spawns (s8, TT18, u6)</li>
                                <li><strong>Doubles Advantage:</strong> Use doubles on paths for instant exit teleportation</li>
                            </ul>
                        </div>

                        <div class="strategy-category psychological">
                            <h3><span class="strategy-icon">🧠</span>Psychological Warfare:</h3>
                            <ul class="strategy-list">
                                <li><strong>Bluffing:</strong> Hide your true financial position and steal card count</li>
                                <li><strong>Negotiation:</strong> Form temporary alliances but be ready to betray when beneficial</li>
                                <li><strong>Pattern Recognition:</strong> Learn opponents' playing patterns and exploit them</li>
                                <li><strong>Pressure Tactics:</strong> Force opponents into bad decisions through strategic property control</li>
                                <li><strong>Endgame Planning:</strong> Position yourself for the final eliminations when others are weakened</li>
                            </ul>
                        </div>
                    </div>

                    <div class="final-warning">
                        🧠 <strong>REMEMBER:</strong> In Horropoly, fortunes can change instantly! Lightning strikes, steal cards, and supernatural forces mean no lead is ever safe. Stay alert, adapt quickly, and trust no one until you're the last survivor standing!
                    </div>
                </div>
            </div>

            <!-- Close Button Section -->
            <div class="controls-section">
                <button class="close-main-btn" onclick="closeHorrorInstructions()">
                    <span class="close-icon">🚪</span>
                    <span class="close-text">Close Instructions & Return to Game</span>
                </button>
            </div>
        </div>
    </div>`;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('horror-instructions-modal');
    
    // Add enhanced mobile-first styles
    if (!document.getElementById('enhanced-horror-instructions-styles')) {
        const styles = document.createElement('style');
        styles.id = 'enhanced-horror-instructions-styles';
        styles.textContent = `
            /* Enhanced Mobile-First Horror Instructions Styles */
            .horror-instructions-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                z-index: 10000;
                backdrop-filter: blur(8px);
                animation: modalFadeIn 0.3s ease-out;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }

            .horror-instructions-modal.show {
                display: block;
            }

            @keyframes modalFadeIn {
                from { 
                    opacity: 0; 
                    transform: scale(0.9);
                }
                to { 
                    opacity: 1; 
                    transform: scale(1);
                }
            }

            .horror-instructions-modal .modal-content {
                position: relative;
                margin: 10px;
                background: linear-gradient(135deg, #1a0000, #2d0000, #1a0000);
                border: 3px solid #8b0000;
                border-radius: 20px;
                padding: 20px;
                max-width: 1200px;
                margin: 10px auto;
                min-height: calc(100vh - 20px);
                box-shadow: 
                    0 0 40px rgba(139, 0, 0, 0.9),
                    inset 0 0 30px rgba(255, 0, 0, 0.1);
                color: #ffffff;
                font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                overflow-y: visible;
            }

            .horror-instructions-modal .modal-header {
                text-align: center;
                margin-bottom: 25px;
                border-bottom: 3px solid #8b0000;
                padding-bottom: 20px;
            }

            .horror-instructions-modal .modal-title {
                font-size: 32px;
                font-weight: bold;
                color: #ff0000;
                text-shadow: 
                    0 0 15px #ff0000,
                    0 0 30px #ff0000,
                    3px 3px 6px rgba(0,0,0,0.8);
                margin: 0;
                animation: titlePulse 3s infinite ease-in-out;
                line-height: 1.2;
            }

            @keyframes titlePulse {
                0%, 100% { text-shadow: 0 0 15px #ff0000, 0 0 30px #ff0000, 3px 3px 6px rgba(0,0,0,0.8); }
                50% { text-shadow: 0 0 25px #ff0000, 0 0 50px #ff0000, 3px 3px 6px rgba(0,0,0,0.8); }
            }

            .horror-instructions-modal .modal-subtitle {
                font-size: 16px;
                color: #cccccc;
                margin: 15px 0 0 0;
                font-style: italic;
                line-height: 1.4;
            }

            .horror-instructions-modal .close-btn {
                position: absolute;
                top: 15px;
                right: 20px;
                background: rgba(139, 0, 0, 0.8);
                border: 2px solid #ff0000;
                color: #ff0000;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                padding: 8px 15px;
                border-radius: 50%;
                transition: all 0.3s ease;
                min-height: 50px;
                min-width: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
            }

            .horror-instructions-modal .close-btn:hover,
            .horror-instructions-modal .close-btn:focus {
                background: rgba(255, 0, 0, 0.3);
                transform: scale(1.1);
                box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
            }

            /* Enhanced Mobile-First Navigation */
            .horror-instructions-modal .nav-buttons {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 10px;
                margin: 20px 0;
                padding: 0 10px;
            }

            .horror-instructions-modal .nav-btn {
                background: linear-gradient(135deg, #8b0000, #a00000);
                color: #ffffff;
                border: 2px solid #ff0000;
                padding: 12px 8px;
                border-radius: 10px;
                cursor: pointer;
                font-family: inherit;
                font-size: 13px;
                font-weight: bold;
                transition: all 0.3s ease;
                min-height: 60px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                text-align: center;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            }

            .horror-instructions-modal .nav-btn:hover,
            .horror-instructions-modal .nav-btn:focus {
                background: linear-gradient(135deg, #a00000, #cc0000);
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(139, 0, 0, 0.4);
            }

            .horror-instructions-modal .nav-btn.active {
                background: linear-gradient(135deg, #ff4444, #ff6666);
                color: #000000;
                border-color: #ffaa00;
                box-shadow: 0 0 15px rgba(255, 170, 0, 0.5);
            }

            .horror-instructions-modal .nav-icon {
                font-size: 20px;
                display: block;
            }

            .horror-instructions-modal .nav-text {
                font-size: 11px;
                line-height: 1.2;
            }

            /* Content Sections */
            .horror-instructions-modal .instruction-tab-content {
                display: none;
                animation: contentSlideIn 0.3s ease-out;
            }

            .horror-instructions-modal .instruction-tab-content.active {
                display: block;
            }

            @keyframes contentSlideIn {
                from { 
                    opacity: 0; 
                    transform: translateY(20px);
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0);
                }
            }

            .horror-instructions-modal .instruction-section {
                margin: 25px 0;
                padding: 20px;
                background: rgba(139, 0, 0, 0.1);
                border: 2px solid #8b0000;
                border-radius: 15px;
                border-left: 6px solid #ff0000;
                box-shadow: inset 0 0 10px rgba(255, 0, 0, 0.1);
            }

            .horror-instructions-modal .section-title {
                font-size: 22px;
                font-weight: bold;
                color: #ff4444;
                margin: 0 0 15px 0;
                text-shadow: 0 0 8px #ff4444;
                line-height: 1.3;
            }

            .horror-instructions-modal .section-text {
                font-size: 16px;
                line-height: 1.6;
                color: #ffffff;
                margin-bottom: 15px;
            }

            /* Rule Grid System */
            .rule-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }

            .rule-item {
                display: flex;
                align-items: flex-start;
                gap: 15px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid #8b0000;
                border-radius: 10px;
                transition: all 0.3s ease;
            }

            .rule-item:hover {
                background: rgba(139, 0, 0, 0.2);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            }

            .rule-icon {
                font-size: 24px;
                min-width: 30px;
                text-align: center;
            }

            .rule-content h3 {
                font-size: 16px;
                color: #ffaa00;
                margin: 0 0 8px 0;
                font-weight: bold;
            }

            .rule-content p {
                font-size: 14px;
                line-height: 1.5;
                margin: 0;
                color: #ffffff;
            }

            /* Rent Information */
            .rent-info {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }

            .rent-formula {
                background: rgba(0, 0, 0, 0.4);
                padding: 20px;
                border-radius: 10px;
                border: 1px solid #8b0000;
            }

            .rent-formula h3 {
                color: #ffaa00;
                font-size: 18px;
                margin: 0 0 15px 0;
            }

            .formula-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .formula-list li {
                padding: 8px 0;
                border-bottom: 1px solid rgba(139, 0, 0, 0.3);
                font-size: 14px;
                line-height: 1.4;
            }

            .formula-list li:last-child {
                border-bottom: none;
            }

            /* Warning and Strategy Boxes */
            .warning-box,
            .strategy-box {
                padding: 15px 20px;
                margin: 20px 0;
                border-radius: 10px;
                font-weight: bold;
                text-align: center;
                line-height: 1.5;
                font-size: 15px;
            }

            .warning-box {
                background: linear-gradient(135deg, #cc4400, #aa3300);
                border: 3px solid #ff6600;
                color: #ffffff;
                box-shadow: 0 0 15px rgba(255, 102, 0, 0.3);
            }

            .strategy-box {
                background: linear-gradient(135deg, #4a0080, #6a00a0);
                border: 3px solid #8a2be2;
                color: #ffffff;
                box-shadow: 0 0 15px rgba(138, 43, 226, 0.3);
            }

            .strategy-box.steal {
                background: linear-gradient(135deg, #8a2be2, #9932cc);
            }

            .strategy-box.lightning {
                background: linear-gradient(135deg, #ffaa00, #ff8800);
                color: #000000;
            }

            .strategy-box.paths {
                background: linear-gradient(135deg, #228b22, #32cd32);
                color: #000000;
            }

            .strategy-box.special {
                background: linear-gradient(135deg, #4169e1, #1e90ff);
            }

            /* Steal Card Specific Styles */
            .steal-card-section {
                background: linear-gradient(135deg, #4a0080, #2d0050);
                border: 3px solid #8a2be2;
                border-radius: 15px;
                padding: 25px;
                margin: 25px 0;
                box-shadow: 0 0 20px rgba(138, 43, 226, 0.3);
            }

            .steal-card-title {
                color: #da70d6;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                margin: 0 0 20px 0;
                text-shadow: 0 0 15px #da70d6;
                animation: stealCardGlow 2s infinite ease-in-out;
            }

            @keyframes stealCardGlow {
                0%, 100% { text-shadow: 0 0 15px #da70d6; }
                50% { text-shadow: 0 0 25px #da70d6, 0 0 35px #da70d6; }
            }

            .steal-info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }

            .steal-card-info {
                background: rgba(218, 112, 214, 0.15);
                border: 2px solid #da70d6;
                border-radius: 10px;
                padding: 20px;
                box-shadow: inset 0 0 10px rgba(218, 112, 214, 0.1);
            }

            .steal-card-info h3 {
                color: #da70d6;
                font-size: 18px;
                margin: 0 0 15px 0;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .info-icon {
                font-size: 20px;
            }

            .steal-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .steal-list li {
                padding: 10px 0;
                border-bottom: 1px solid rgba(218, 112, 214, 0.3);
                font-size: 14px;
                line-height: 1.5;
                position: relative;
                padding-left: 20px;
            }

            .steal-list li:before {
                content: "🎴";
                position: absolute;
                left: 0;
                top: 10px;
            }

            .steal-list li:last-child {
                border-bottom: none;
            }

            .highlight-green {
                color: #32cd32;
                font-weight: bold;
                text-shadow: 0 0 5px #32cd32;
            }

            /* GO Bonus Progression */
            .go-bonus-section {
                margin: 25px 0;
                padding: 20px;
                background: rgba(0, 0, 0, 0.4);
                border-radius: 15px;
                border: 2px solid #ffaa00;
            }

            .go-progression {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }

            .go-step {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px;
                background: rgba(139, 0, 0, 0.2);
                border-radius: 10px;
                border: 1px solid #8b0000;
                transition: all 0.3s ease;
            }

            .go-step.highlight {
                background: rgba(255, 170, 0, 0.2);
                border-color: #ffaa00;
                box-shadow: 0 0 10px rgba(255, 170, 0, 0.3);
            }

            .step-number {
                font-size: 24px;
                font-weight: bold;
                color: #ffaa00;
                min-width: 40px;
                text-align: center;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 50%;
                padding: 10px;
                line-height: 1;
            }

            .step-content h4 {
                color: #ffffff;
                font-size: 16px;
                margin: 0 0 5px 0;
            }

            .step-content p {
                color: #cccccc;
                font-size: 14px;
                margin: 0;
                line-height: 1.4;
            }

            /* Lightning Specific Styles */
            .lightning-section {
                background: linear-gradient(135deg, #2c1810, #1a0f08);
                border: 3px solid #ffaa00;
                border-radius: 15px;
                padding: 25px;
                margin: 25px 0;
                box-shadow: 0 0 20px rgba(255, 170, 0, 0.3);
            }

            .lightning-title {
                color: #ffaa00;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                margin: 0 0 20px 0;
                text-shadow: 0 0 15px #ffaa00;
                animation: lightningFlash 3s infinite ease-in-out;
            }

            @keyframes lightningFlash {
                0%, 90%, 100% { text-shadow: 0 0 15px #ffaa00; }
                95% { text-shadow: 0 0 25px #ffaa00, 0 0 35px #ffffff; }
            }

            .lightning-info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }

            .lightning-info {
                background: rgba(255, 170, 0, 0.1);
                border: 2px solid #ffaa00;
                border-radius: 10px;
                padding: 20px;
                box-shadow: inset 0 0 10px rgba(255, 170, 0, 0.1);
            }

            .lightning-info h3 {
                color: #ffaa00;
                font-size: 18px;
                margin: 0 0 15px 0;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .lightning-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .lightning-list li {
                padding: 10px 0;
                border-bottom: 1px solid rgba(255, 170, 0, 0.3);
                font-size: 14px;
                line-height: 1.5;
                position: relative;
                padding-left: 20px;
            }

            .lightning-list li:before {
                content: "⚡";
                position: absolute;
                left: 0;
                top: 10px;
            }

            .lightning-list li:last-child {
                border-bottom: none;
            }

            .effect-categories {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 15px;
                margin: 15px 0;
            }

            .effect-category {
                background: rgba(0, 0, 0, 0.3);
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #ffaa00;
            }

            .effect-category h4 {
                color: #ffaa00;
                font-size: 16px;
                margin: 0 0 10px 0;
            }

            .effect-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .effect-list li {
                padding: 5px 0;
                font-size: 13px;
                line-height: 1.4;
                position: relative;
                padding-left: 15px;
            }

            .effect-list li:before {
                content: "💥";
                position: absolute;
                left: 0;
                top: 5px;
                font-size: 10px;
            }

            /* Snake Paths Specific Styles */
            .paths-section {
                background: linear-gradient(135deg, #0f2a0f, #1a4d1a);
                border: 3px solid #32cd32;
                border-radius: 15px;
                padding: 25px;
                margin: 25px 0;
                box-shadow: 0 0 20px rgba(50, 205, 50, 0.3);
            }

            .paths-title {
                color: #32cd32;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                margin: 0 0 20px 0;
                text-shadow: 0 0 15px #32cd32;
                animation: pathGlow 4s infinite ease-in-out;
            }

            @keyframes pathGlow {
                0%, 100% { text-shadow: 0 0 15px #32cd32; }
                50% { text-shadow: 0 0 25px #32cd32, 0 0 35px #90ee90; }
            }

            .paths-info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }

            .path-info {
                background: rgba(50, 205, 50, 0.1);
                border: 2px solid #32cd32;
                border-radius: 10px;
                padding: 20px;
                box-shadow: inset 0 0 10px rgba(50, 205, 50, 0.1);
            }

            .path-info h3 {
                color: #32cd32;
                font-size: 18px;
                margin: 0 0 15px 0;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .path-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .path-list li {
                padding: 10px 0;
                border-bottom: 1px solid rgba(50, 205, 50, 0.3);
                font-size: 14px;
                line-height: 1.5;
                position: relative;
                padding-left: 20px;
            }

            .path-list li:before {
                content: "🐍";
                position: absolute;
                left: 0;
                top: 10px;
            }

            .path-list li:last-child {
                border-bottom: none;
            }

            /* Money System */
            .money-system {
                margin: 25px 0;
                padding: 20px;
                background: rgba(0, 0, 0, 0.4);
                border-radius: 15px;
                border: 2px solid #ffd700;
            }

            .money-info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }

            .money-info {
                background: rgba(255, 215, 0, 0.1);
                border: 2px solid #ffd700;
                border-radius: 10px;
                padding: 20px;
                box-shadow: inset 0 0 10px rgba(255, 215, 0, 0.1);
            }

            .money-info h4 {
                color: #ffd700;
                font-size: 16px;
                margin: 0 0 15px 0;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .money-icon {
                font-size: 18px;
            }

            .money-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .money-list li {
                padding: 8px 0;
                border-bottom: 1px solid rgba(255, 215, 0, 0.3);
                font-size: 14px;
                line-height: 1.5;
                position: relative;
                padding-left: 20px;
            }

            .money-list li:before {
                content: "💰";
                position: absolute;
                left: 0;
                top: 8px;
            }

            .money-list li:last-child {
                border-bottom: none;
            }

            /* Special Squares Grid */
            .special-squares-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 20px;
                margin: 25px 0;
            }

            .special-square {
                background: rgba(139, 0, 0, 0.2);
                border: 2px solid #8b0000;
                border-radius: 15px;
                padding: 20px;
                transition: all 0.3s ease;
                display: flex;
                align-items: flex-start;
                gap: 15px;
            }

            .special-square:hover {
                background: rgba(139, 0, 0, 0.3);
                transform: translateY(-3px);
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
            }

            .square-icon {
                font-size: 32px;
                min-width: 40px;
                text-align: center;
            }

            .square-content h3 {
                font-size: 18px;
                color: #ffaa00;
                margin: 0 0 10px 0;
                font-weight: bold;
            }

            .square-content p {
                font-size: 14px;
                line-height: 1.5;
                margin: 0;
                color: #ffffff;
            }

            /* Flash Messages */
            .flash-messages {
                margin: 25px 0;
                padding: 20px;
                background: rgba(0, 0, 0, 0.4);
                border-radius: 15px;
                border: 2px solid #ff69b4;
            }

            .flash-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 15px 0;
            }

            .flash-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 15px;
                background: rgba(255, 105, 180, 0.1);
                border-radius: 10px;
                border: 1px solid #ff69b4;
                text-align: center;
            }

            .flash-text {
                font-weight: bold;
                font-size: 14px;
                padding: 5px 10px;
                border-radius: 5px;
                text-shadow: 0 0 5px currentColor;
            }

            .flash-text.bonus {
                color: #32cd32;
                background: rgba(50, 205, 50, 0.2);
            }

            .flash-text.teleport {
                color: #1e90ff;
                background: rgba(30, 144, 255, 0.2);
            }

            .flash-text.yang {
                color: #ffd700;
                background: rgba(255, 215, 0, 0.2);
            }

            .flash-text.dungeon {
                color: #ff6347;
                background: rgba(255, 99, 71, 0.2);
            }

            .flash-text.lightning {
                color: #ffaa00;
                background: rgba(255, 170, 0, 0.2);
            }

            .flash-desc {
                font-size: 12px;
                color: #cccccc;
                line-height: 1.3;
            }

            /* Survival Strategy Styles */
            .survival-section {
                background: linear-gradient(135deg, #2d1b69, #1e1040);
                border: 3px solid #9370db;
                border-radius: 15px;
                padding: 25px;
                margin: 25px 0;
                box-shadow: 0 0 20px rgba(147, 112, 219, 0.3);
            }

            .strategy-categories {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
                margin: 25px 0;
            }

            .strategy-category {
                background: rgba(147, 112, 219, 0.1);
                border: 2px solid #9370db;
                border-radius: 15px;
                padding: 25px;
                box-shadow: inset 0 0 10px rgba(147, 112, 219, 0.1);
            }

            .strategy-category.financial {
                border-color: #32cd32;
                background: rgba(50, 205, 50, 0.1);
            }

            .strategy-category.steal {
                border-color: #da70d6;
                background: rgba(218, 112, 214, 0.1);
            }

            .strategy-category.survival {
                border-color: #ffaa00;
                background: rgba(255, 170, 0, 0.1);
            }

            .strategy-category.psychological {
                border-color: #ff6347;
                background: rgba(255, 99, 71, 0.1);
            }

            .strategy-category h3 {
                font-size: 18px;
                margin: 0 0 15px 0;
                display: flex;
                align-items: center;
                gap: 10px;
                color: #9370db;
            }

            .strategy-category.financial h3 { color: #32cd32; }
            .strategy-category.steal h3 { color: #da70d6; }
            .strategy-category.survival h3 { color: #ffaa00; }
            .strategy-category.psychological h3 { color: #ff6347; }

            .strategy-icon {
                font-size: 20px;
            }

            .strategy-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .strategy-list li {
                padding: 12px 0;
                border-bottom: 1px solid rgba(147, 112, 219, 0.3);
                font-size: 14px;
                line-height: 1.6;
                position: relative;
                padding-left: 20px;
            }

            .strategy-list li:before {
                content: "🧠";
                position: absolute;
                left: 0;
                top: 12px;
            }

            .strategy-category.financial .strategy-list li:before { content: "💰"; }
            .strategy-category.steal .strategy-list li:before { content: "🎴"; }
            .strategy-category.survival .strategy-list li:before { content: "⚡"; }
            .strategy-category.psychological .strategy-list li:before { content: "🧠"; }

            .strategy-list li:last-child {
                border-bottom: none;
            }

            .final-warning {
                background: linear-gradient(135deg, #8b0000, #a00000);
                border: 3px solid #ff0000;
                border-radius: 15px;
                padding: 25px;
                margin: 25px 0;
                color: #ffffff;
                font-weight: bold;
                text-align: center;
                font-size: 16px;
                line-height: 1.6;
                box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);
                animation: finalWarningPulse 4s infinite ease-in-out;
            }

            @keyframes finalWarningPulse {
                0%, 100% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.3); }
                50% { box-shadow: 0 0 30px rgba(255, 0, 0, 0.5), inset 0 0 20px rgba(255, 0, 0, 0.1); }
            }

            /* Close Button */
            .controls-section {
                text-align: center;
                margin: 30px 0 20px 0;
                padding: 20px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 15px;
                border: 2px solid #8b0000;
            }

            .close-main-btn {
                background: linear-gradient(135deg, #8b0000, #a00000);
                color: #ffffff;
                border: 3px solid #ff0000;
                padding: 15px 30px;
                border-radius: 15px;
                cursor: pointer;
                font-family: inherit;
                font-size: 16px;
                font-weight: bold;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin: 0 auto;
                min-height: 60px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            }

            .close-main-btn:hover,
            .close-main-btn:focus {
                background: linear-gradient(135deg, #a00000, #cc0000);
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(139, 0, 0, 0.4);
            }

            .close-icon {
                font-size: 20px;
            }

            .close-text {
                font-size: 16px;
            }

            /* Mobile Responsive Styles */
            @media (max-width: 768px) {
                .horror-instructions-modal .modal-content {
                    margin: 5px;
                    padding: 15px;
                    border-radius: 15px;
                    min-height: calc(100vh - 10px);
                }

                .horror-instructions-modal .modal-title {
                    font-size: 24px;
                    line-height: 1.2;
                }

                .horror-instructions-modal .modal-subtitle {
                    font-size: 14px;
                }

                .horror-instructions-modal .close-btn {
                    top: 10px;
                    right: 15px;
                    font-size: 24px;
                    padding: 10px;
                    min-height: 44px;
                    min-width: 44px;
                }

                .horror-instructions-modal .nav-buttons {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                    margin: 15px 0;
                    padding: 0 5px;
                }

                .horror-instructions-modal .nav-btn {
                    padding: 10px 6px;
                    min-height: 55px;
                    font-size: 12px;
                }

                .horror-instructions-modal .nav-icon {
                    font-size: 18px;
                }

                .horror-instructions-modal .nav-text {
                    font-size: 10px;
                }

                .horror-instructions-modal .instruction-section {
                    margin: 20px 0;
                    padding: 15px;
                }

                .horror-instructions-modal .section-title {
                    font-size: 20px;
                    margin-bottom: 12px;
                }

                .horror-instructions-modal .section-text {
                    font-size: 15px;
                }

                .rule-grid {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }

                .rule-item {
                    padding: 12px;
                }

                .rule-icon {
                    font-size: 20px;
                    min-width: 25px;
                }

                .rule-content h3 {
                    font-size: 15px;
                }

                .rule-content p {
                    font-size: 13px;
                }

                .rent-info,
                .steal-info-grid,
                .lightning-info-grid,
                .paths-info-grid,
                .money-info-grid,
                .strategy-categories {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }

                .special-squares-grid {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }

                .special-square {
                    padding: 15px;
                }

                .square-icon {
                    font-size: 28px;
                    min-width: 35px;
                }

                .square-content h3 {
                    font-size: 16px;
                }

                .square-content p {
                    font-size: 13px;
                }

                .go-progression {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }

                .go-step {
                    padding: 12px;
                }

                .step-number {
                    font-size: 20px;
                    min-width: 35px;
                    padding: 8px;
                }

                .flash-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                }

                .flash-item {
                    padding: 10px;
                }

                .flash-text {
                    font-size: 12px;
                }

                .flash-desc {
                    font-size: 11px;
                }

                .close-main-btn {
                    padding: 12px 20px;
                    font-size: 14px;
                    min-height: 50px;
                }

                .close-icon {
                    font-size: 18px;
                }

                .close-text {
                    font-size: 14px;
                }

                .warning-box,
                .strategy-box {
                    padding: 12px 15px;
                    font-size: 14px;
                }

                .final-warning {
                    padding: 20px;
                    font-size: 15px;
                }
            }

            /* Extra small mobile devices */
            @media (max-width: 480px) {
                .horror-instructions-modal .modal-content {
                    margin: 2px;
                    padding: 12px;
                    border-radius: 12px;
                    min-height: calc(100vh - 4px);
                }

                .horror-instructions-modal .modal-title {
                    font-size: 20px;
                }

                .horror-instructions-modal .modal-subtitle {
                    font-size: 13px;
                }

                .horror-instructions-modal .nav-buttons {
                    grid-template-columns: repeat(3, 1fr);
                    gap: 6px;
                    margin: 12px 0;
                }

                .horror-instructions-modal .nav-btn {
                    padding: 8px 4px;
                    min-height: 50px;
                    font-size: 11px;
                }

                .horror-instructions-modal .nav-icon {
                    font-size: 16px;
                }

                .horror-instructions-modal .nav-text {
                    font-size: 9px;
                }

                .horror-instructions-modal .section-title {
                    font-size: 18px;
                }

                .horror-instructions-modal .section-text {
                    font-size: 14px;
                }

                .rule-content h3 {
                    font-size: 14px;
                }

                .rule-content p {
                    font-size: 12px;
                }

                .close-main-btn {
                    padding: 10px 15px;
                    font-size: 13px;
                    min-height: 45px;
                    flex-direction: column;
                    gap: 5px;
                }

                .close-icon {
                    font-size: 16px;
                }

                .close-text {
                    font-size: 12px;
                    line-height: 1.2;
                }
            }

            /* Landscape mobile orientation */
            @media (max-width: 768px) and (orientation: landscape) {
                .horror-instructions-modal .modal-content {
                    max-height: calc(100vh - 10px);
                    padding: 10px 15px;
                }

                .horror-instructions-modal .modal-title {
                    font-size: 22px;
                    margin-bottom: 10px;
                }

                .horror-instructions-modal .modal-header {
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                }

                .horror-instructions-modal .nav-buttons {
                    grid-template-columns: repeat(6, 1fr);
                    gap: 5px;
                    margin: 10px 0;
                }

                .horror-instructions-modal .nav-btn {
                    min-height: 45px;
                    padding: 6px 4px;
                }

                .horror-instructions-modal .instruction-section {
                    margin: 15px 0;
                    padding: 12px;
                }
            }

            /* High DPI / Retina Display Support */
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                .horror-instructions-modal .modal-title {
                    text-shadow: 
                        0 0 8px #ff0000,
                        0 0 16px #ff0000,
                        2px 2px 4px rgba(0,0,0,0.8);
                }

                .horror-instructions-modal .section-title {
                    text-shadow: 0 0 4px #ff4444;
                }
            }

            /* Print Styles (if someone wants to print instructions) */
            @media print {
                .horror-instructions-modal {
                    position: static !important;
                    background: white !important;
                    color: black !important;
                }

                .horror-instructions-modal .modal-content {
                    background: white !important;
                    border: 2px solid black !important;
                    box-shadow: none !important;
                    color: black !important;
                }

                .horror-instructions-modal .close-btn,
                .horror-instructions-modal .controls-section {
                    display: none !important;
                }

                .horror-instructions-modal .nav-buttons {
                    display: none !important;
                }

                .horror-instructions-modal .instruction-tab-content {
                    display: block !important;
                }

                .horror-instructions-modal .modal-title {
                    color: black !important;
                    text-shadow: none !important;
                    animation: none !important;
                }
            }

            /* Accessibility Improvements */
            @media (prefers-reduced-motion: reduce) {
                .horror-instructions-modal,
                .horror-instructions-modal *,
                .horror-instructions-modal *:before,
                .horror-instructions-modal *:after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }

            /* Focus styles for accessibility */
            .horror-instructions-modal .nav-btn:focus,
            .horror-instructions-modal .close-btn:focus,
            .horror-instructions-modal .close-main-btn:focus {
                outline: 3px solid #ffaa00;
                outline-offset: 2px;
            }

            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .horror-instructions-modal .modal-content {
                    background: #000000 !important;
                    border-color: #ffffff !important;
                }

                .horror-instructions-modal .instruction-section {
                    background: #111111 !important;
                    border-color: #ffffff !important;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    // Show modal with enhanced animation
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Focus management for accessibility
    const firstFocusableElement = modal.querySelector('.close-btn');
    if (firstFocusableElement) {
        firstFocusableElement.focus();
    }
    
    // Trap focus within modal
    trapFocus(modal);
    
    console.log('🩸 Enhanced Horror Instructions Modal displayed successfully');
}

// Enhanced close function
function closeHorrorInstructions() {
    const modal = document.getElementById('horror-instructions-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Remove modal after animation
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
    console.log('🩸 Horror Instructions Modal closed');
}

// Enhanced tab switching with better mobile support
function showInstructionTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.instruction-tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all buttons
    const navButtons = document.querySelectorAll('.horror-instructions-modal .nav-btn');
    navButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Show selected tab
    const targetTab = document.getElementById(`instruction-tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.add('active');
        
        // Scroll to top of content for mobile
        const modalContent = document.querySelector('.horror-instructions-modal .modal-content');
        if (modalContent && window.innerWidth <= 768) {
            modalContent.scrollTop = 0;
        }
    }
    
    // Highlight active button
    const activeButton = document.querySelector(`.horror-instructions-modal .nav-btn[data-tab="${tabName}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    console.log(`🩸 Switched to instruction tab: ${tabName}`);
}

// Focus trap utility for accessibility
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    });
}

// Enhanced event listeners for better mobile support
document.addEventListener('click', function(e) {
    const modal = document.getElementById('horror-instructions-modal');
    if (modal && e.target === modal) {
        closeHorrorInstructions();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('horror-instructions-modal');
        if (modal && modal.classList.contains('show')) {
            closeHorrorInstructions();
        }
    }
});

// Touch event optimization for mobile
let touchStartY = 0;
document.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', function(e) {
    const modal = document.getElementById('horror-instructions-modal');
    if (modal && modal.classList.contains('show')) {
        const touchEndY = e.changedTouches[0].clientY;
        const touchDiff = touchStartY - touchEndY;
        
        // If user swipes down significantly at the top of the modal, close it
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent && modalContent.scrollTop === 0 && touchDiff < -100) {
            closeHorrorInstructions();
        }
    }
}, { passive: true });

// Export functions for global access
window.showHorrorInstructions = showHorrorInstructions;
window.closeHorrorInstructions = closeHorrorInstructions;
window.showInstructionTab = showInstructionTab;

console.log('🩸 Enhanced Mobile-Friendly Instructions System loaded successfully!');
