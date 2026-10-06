# Ribh site: go-live checklist

1. Supabase (free): create a project at supabase.com. Open SQL Editor, paste all of `supabase-setup.sql`, click Run.
2. Supabase > Authentication > URL Configuration: set Site URL to your live site and add `<your site>/admin.html` to Redirect URLs.
3. Supabase > Project Settings > API: copy the Project URL and the anon public key into `config.js`.
4. Upload everything in this folder to the root of your GitHub repo (replace `index.html`).
5. Open `<your site>/admin.html`, sign in with mahmoudyahya66@gmail.com (owner). Use Team to add other admins.
6. Funnel Check: do NOT put its file on GitHub. In Admin > Funnel Check (owner only), choose your Funnel Check .html file. It is stored in the database and only signed-in admins can open it.
7. SEO: if you get a custom domain, replace `https://mahmoudyahya111.github.io/My-Mb/` in `index.html`, `robots.txt` and `sitemap.xml`. Then add the site in Google Search Console and submit `sitemap.xml`.
