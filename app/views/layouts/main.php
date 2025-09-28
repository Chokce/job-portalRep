<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle ?? 'JobConnect - Online Job Portal'; ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/public/assets/css/style.css">
</head>
<body>
    <!-- Header -->
    <header>
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <i class="fas fa-briefcase"></i>
                    <a href="/">JobConnect</a>
                </div>

                <div class="menu-toggle" id="mobile-menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

                <nav>
                    <ul class="nav-menu" id="nav-menu">
                        <li class="nav-item">
                            <a href="/" class="nav-link <?php echo $currentPage === 'home' ? 'active' : ''; ?>">Home</a>
                        </li>
                        <li class="nav-item">
                            <a href="/jobs/post" class="nav-link <?php echo $currentPage === 'post-job' ? 'active' : ''; ?>">Post a Job</a>
                        </li>
                        <li class="nav-item">
                            <a href="/jobs" class="nav-link <?php echo $currentPage === 'find-jobs' ? 'active' : ''; ?>">Find Jobs</a>
                        </li>
                        <li class="nav-item">
                            <a href="/about" class="nav-link <?php echo $currentPage === 'about' ? 'active' : ''; ?>">About Us</a>
                        </li>
                        <li class="nav-item">
                            <a href="#" class="nav-link">Resources <i class="fas fa-caret-down"></i></a>
                            <div class="dropdown">
                                <a href="/career-advice" class="dropdown-item">Career Advice</a>
                                <a href="/interview-tips" class="dropdown-item">Interview Tips</a>
                            </div>
                        </li>
                    </ul>
                </nav>

                <div class="auth-buttons">
                    <?php if (isset($_SESSION['user_id'])): ?>
                        <div class="user-menu">
                            <span>Welcome, <?php echo htmlspecialchars($_SESSION['username']); ?></span>
                            <a href="/auth/logout" class="btn btn-outline">Logout</a>
                        </div>
                    <?php else: ?>
                        <a href="/auth/login" class="btn btn-outline">Login</a>
                        <a href="/auth/register" class="btn btn-primary">Register</a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main>
        <?php echo $content ?? ''; ?>
    </main>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-content">
                <div class="footer-column">
                    <h3>JobConnect</h3>
                    <p>The leading platform for job seekers and employers to connect with opportunities.</p>
                    <div class="social-links">
                        <a href="https://facebook.com" target="_blank" rel="noopener"><i class="fab fa-facebook-f"></i></a>
                        <a href="https://twitter.com" target="_blank" rel="noopener"><i class="fab fa-twitter"></i></a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener"><i class="fab fa-linkedin-in"></i></a>
                    </div>
                </div>
                <div class="footer-column">
                    <h3>For Job Seekers</h3>
                    <ul>
                        <li><a href="/jobs">Browse Jobs</a></li>
                        <li><a href="/career-advice">Career Resources</a></li>
                        <li><a href="/resume-builder">Resume Builder</a></li>
                        <li><a href="/job-alerts">Job Alerts</a></li>
                    </ul>
                </div>
                <div class="footer-column">
                    <h3>For Employers</h3>
                    <ul>
                        <li><a href="/jobs/post">Post a Job</a></li>
                        <li><a href="/browse-resumes">Search Resumes</a></li>
                        <li><a href="/recruiting-solutions">Recruiting Solutions</a></li>
                        <li><a href="/pricing">Pricing Plans</a></li>
                    </ul>
                </div>
                <div class="footer-column">
                    <h3>Contact Us</h3>
                    <ul>
                        <li><i class="fas fa-map-marker-alt"></i> 123 Main St, City, Country</li>
                        <li><i class="fas fa-phone"></i> +1 (555) 123-4567</li>
                        <li><i class="fas fa-envelope"></i> info@jobconnect.com</li>
                    </ul>
                </div>
            </div>
            <div class="copyright">
                <p>&copy; <?php echo date('Y'); ?> JobConnect. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script src="/assets/js/main.js"></script>
    <?php if (isset($pageScripts)) echo $pageScripts; ?>
</body>
</html>
