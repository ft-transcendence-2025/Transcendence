// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract SimpleStorage{
    struct Match {
        uint256 tournamentId;
        uint256 matchId;
        uint256 player1; //This could be the wallet address.
        uint256 player2; //The same.
        uint256 score1;
        uint256 score2;
        uint256 winner;
        uint256 startTime; // Optional
        uint256 endTime; // Optional
    }

    Match[] public matches;

    function newMatch(
        uint256 tournamentId,
        uint256 matchId,
        uint256 player1,
        uint256 player2,
        uint256 score1,
        uint256 score2,
        uint256 winner,
        uint256 startTime,
        uint256 endTime
    ) public {
        Match memory m = Match(
            tournamentId,
            matchId,
            player1,
            player2,
            score1,
            score2,
            winner,
            startTime,
            endTime
        );
        matches.push(m);
    }

    function getMatchCount() public view returns (uint256) {
        return matches.length;
    }

    function getMatch(uint256 index) public view returns (
        uint256 tournamentId,
        uint256 matchId,
        uint256 player1,
        uint256 player2,
        uint256 score1,
        uint256 score2,
        uint256 winner,
        uint256 startTime,
        uint256 endTime
    ) {
        Match memory m = matches[index];
        return (
            m.tournamentId,
            m.matchId,
            m.player1,
            m.player2,
            m.score1,
            m.score2,
            m.winner,
            m.startTime,
            m.endTime
        );
    }

}