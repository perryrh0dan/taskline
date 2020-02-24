module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'subject-max-length': [1, 'always', 100],
        'type-enum': [
            1,
            'always',
            [
                'feat',
                'fix',
                'docs',
                'stlyle',
                'refactor',
                'perf',
                'test',
                'revert',
                'ci',
                'chore'
            ]
        ]
    }
};
